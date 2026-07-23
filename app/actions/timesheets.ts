"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { appendTimesheetLog } from "@/utils/timesheet-log";
import { z } from "zod";

// ─── Zod schema ────────────────────────────────────────────────────────────
const adminTimesheetSchema = z.object({
    id: z.string().uuid().optional(),                      // undefined = create
    userId: z.string().uuid(),
    clockIn: z.string().min(1, "Clock-in time is required"),   // UTC ISO string
    clockOut: z.string().nullable().optional(),                // UTC ISO string
    kitchenId: z.string().uuid().nullable().optional(),
    notes: z.string().optional(),
});

export type AdminTimesheetFormValues = z.infer<typeof adminTimesheetSchema>;

// ─── Helper ────────────────────────────────────────────────────────────────
async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" as const };
    const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return { error: "Not authorized" as const };
    return { user };
}

export async function verifyTimesheets(timesheetIds: string[]) {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Not authenticated" };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { error: "Not authorized" };
    }

    if (!timesheetIds || timesheetIds.length === 0) {
        return { error: "No timesheets selected" };
    }

    // Update timesheets status
    const { error: updateError } = await supabase
        .from('timesheets')
        .update({ status: 'verified' })
        .in('id', timesheetIds);

    if (updateError) {
        console.error("Error verifying timesheets:", updateError);
        return { error: "Failed to verify timesheets" };
    }

    appendTimesheetLog({ op: 'timesheets_verified', timesheetIds, adminId: user.id });
    revalidatePath('/admin/timesheets');
    revalidatePath('/timesheets');
    revalidatePath('/billing');
    return { success: true };
}

// ─── Admin: create or update a timesheet entry ────────────────────────────
export async function adminUpsertTimesheet(raw: AdminTimesheetFormValues) {
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if ("error" in auth) return { error: auth.error };

    const parsed = adminTimesheetSchema.safeParse(raw);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { id, userId, clockIn, clockOut, kitchenId, notes } = parsed.data;

    const clockInDate = new Date(clockIn);
    const clockOutDate = clockOut ? new Date(clockOut) : null;

    if (clockOutDate && clockOutDate <= clockInDate) {
        return { error: "Clock-out must be after clock-in" };
    }

    const durationMinutes = clockOutDate
        ? Math.round((clockOutDate.getTime() - clockInDate.getTime()) / 60000)
        : null;

    const isEdit = Boolean(id);

    const payload: Record<string, unknown> = {
        user_id: userId,
        clock_in: clockIn,
        clock_out: clockOut ?? null,
        duration_minutes: durationMinutes,
        kitchen_id: kitchenId ?? null,
        notes: notes ?? null,
        status: "pending",
    };

    if (isEdit) {
        payload.is_edited = true;
        payload.edited_at = new Date().toISOString();
    }

    if (isEdit && id) {
        const { error } = await supabase
            .from("timesheets")
            .update(payload)
            .eq("id", id);
        if (error) {
            console.error("adminUpsertTimesheet update error:", error);
            return { error: "Failed to update timesheet" };
        }
        appendTimesheetLog({
            op: "timesheet_edit",
            timesheetId: id,
            userId,
            clockIn,
            clockOut: clockOut ?? null,
        });
    } else {
        const { error } = await supabase.from("timesheets").insert([payload]);
        if (error) {
            console.error("adminUpsertTimesheet insert error:", error);
            return { error: "Failed to create timesheet entry" };
        }
    }

    revalidatePath("/admin/timesheets");
    revalidatePath("/timesheets");
    revalidatePath("/billing");
    return { success: true };
}

// ─── Admin: delete a timesheet entry ─────────────────────────────────────
export async function adminDeleteTimesheet(id: string) {
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if ("error" in auth) return { error: auth.error };

    const { error } = await supabase.from("timesheets").delete().eq("id", id);
    if (error) {
        console.error("adminDeleteTimesheet error:", error);
        return { error: "Failed to delete timesheet entry" };
    }

    revalidatePath("/admin/timesheets");
    revalidatePath("/timesheets");
    revalidatePath("/billing");
    return { success: true };
}

// ─── Tenant: request a missed shift be added ──────────────────────────────
const missingShiftRequestSchema = z.object({
    clockIn: z.string().min(1, "Clock-in time is required"),
    clockOut: z.string().optional(),
    reason: z.string().min(5, "Please describe what happened"),
}).refine(
    (data) => !data.clockOut || new Date(data.clockIn) < new Date(data.clockOut),
    { message: "Clock out must be after clock in", path: ["clockOut"] }
);

export type MissingShiftRequestValues = z.infer<typeof missingShiftRequestSchema>;

export async function requestMissingTimesheetEntry(raw: MissingShiftRequestValues) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const parsed = missingShiftRequestSchema.safeParse(raw);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const clockIn = new Date(parsed.data.clockIn).toISOString();
    const clockOut = parsed.data.clockOut ? new Date(parsed.data.clockOut).toISOString() : null;

    const { data, error } = await supabase
        .from("timesheet_requests")
        .insert({
            user_id: user.id,
            timesheet_id: null,
            type: "create",
            clock_in: clockIn,
            clock_out: clockOut,
            reason: parsed.data.reason,
            status: "pending",
        })
        .select("id")
        .single();

    if (error) {
        console.error("requestMissingTimesheetEntry error:", error);
        return { error: "Failed to submit request" };
    }

    appendTimesheetLog({
        op: "request_submitted",
        requestId: data.id,
        type: "create",
        userId: user.id,
        clockIn,
        clockOut,
    });

    revalidatePath("/timesheets");
    revalidatePath("/admin/timesheets");
    return { success: true };
}

// ─── Admin: approve or reject a tenant timesheet request ─────────────────
async function reviewTimesheetRequest(
    requestId: string,
    status: "approved" | "rejected",
    adminNotes: string | undefined,
) {
    const supabase = await createClient();
    const auth = await assertAdmin(supabase);
    if ("error" in auth) return { error: auth.error };
    const adminId = auth.user.id;

    const { data: request, error: fetchError } = await supabase
        .from("timesheet_requests")
        .select("id, status, type, timesheet_id, clock_in, clock_out, user_id")
        .eq("id", requestId)
        .single();

    if (fetchError || !request) return { error: "Request not found" };
    if (request.status !== "pending") return { error: "Request already processed" };

    if (status === "approved") {
        const { type, timesheet_id, clock_in, clock_out, user_id } = request;

        if (type === "create") {
            const { error } = await supabase
                .from("timesheets")
                .insert({
                    user_id,
                    clock_in,
                    clock_out,
                    notes: "Created via admin approval of missed-shift request",
                });
            if (error) {
                console.error("reviewTimesheetRequest create error:", error);
                return { error: "Failed to create timesheet entry" };
            }
        } else if (type === "update" && timesheet_id) {
            const updates: Record<string, unknown> = { is_edited: true, edited_at: new Date().toISOString() };
            if (clock_in) updates.clock_in = clock_in;
            if (clock_out) updates.clock_out = clock_out;
            const { error } = await supabase.from("timesheets").update(updates).eq("id", timesheet_id);
            if (error) {
                console.error("reviewTimesheetRequest update error:", error);
                return { error: "Failed to update timesheet entry" };
            }
        } else if (type === "delete" && timesheet_id) {
            const { error } = await supabase.from("timesheets").delete().eq("id", timesheet_id);
            if (error) {
                console.error("reviewTimesheetRequest delete error:", error);
                return { error: "Failed to delete timesheet entry" };
            }
        }
    }

    const { error: updateReqError } = await supabase
        .from("timesheet_requests")
        .update({
            status,
            admin_notes: adminNotes ?? null,
            reviewed_by: adminId,
            reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);

    if (updateReqError) {
        console.error("reviewTimesheetRequest status update error:", updateReqError);
        return { error: "Failed to update request status" };
    }

    if (status === "approved") {
        appendTimesheetLog({
            op: "request_approved",
            requestId,
            type: request.type as "create" | "update" | "delete",
            timesheetId: request.timesheet_id,
            userId: request.user_id,
            adminId,
            clockIn: request.clock_in,
            clockOut: request.clock_out,
        });
    } else {
        appendTimesheetLog({
            op: "request_rejected",
            requestId,
            type: request.type as "create" | "update" | "delete",
            timesheetId: request.timesheet_id,
            userId: request.user_id,
            adminId,
            notes: adminNotes ?? null,
        });
    }

    revalidatePath("/admin/timesheets");
    revalidatePath("/timesheets");
    revalidatePath("/billing");
    return { success: true };
}

export async function approveTimesheetRequest(requestId: string, adminNotes?: string) {
    return reviewTimesheetRequest(requestId, "approved", adminNotes);
}

export async function rejectTimesheetRequest(requestId: string, adminNotes?: string) {
    return reviewTimesheetRequest(requestId, "rejected", adminNotes);
}
