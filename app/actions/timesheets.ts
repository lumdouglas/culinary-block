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
