"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

function calculateTieredCost(totalHours: number): number {
    let cost = 0;
    let remaining = totalHours;
    const tier1 = Math.min(remaining, 20);
    cost += tier1 * 50;
    remaining -= tier1;
    if (remaining <= 0) return cost;
    const tier2 = Math.min(remaining, 80);
    cost += tier2 * 40;
    remaining -= tier2;
    if (remaining <= 0) return cost;
    cost += remaining * 30;
    return cost;
}

function getCurrentTier(totalHours: number): string {
    if (totalHours <= 20) return "$50/hr";
    if (totalHours <= 100) return "$40/hr";
    return "$30/hr";
}

export type TenantBillingSummary = {
    tenantId: string;
    companyName: string;
    email: string | null;
    totalMinutes: number;
    totalHours: number;
    sessionCount: number;
    estimatedCost: number;
    currentTier: string;
    billingStatus: "in_progress" | "pending" | "invoiced";
};

export type AdminBillingData = {
    month: string;
    tenants: TenantBillingSummary[];
    totals: { hours: number; cost: number; activeTenants: number };
    availableMonths: string[];
};

/**
 * Admin-only: fetch billing summary for all tenants for a given month.
 * Computes hours, cost, and tier from timesheets.
 */
export async function getAdminBillingData(month: string): Promise<{ data?: AdminBillingData; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
    if (profile?.role !== "admin") return { error: "Not authorized" };

    const [year, mon] = month.split("-").map(Number);
    const startUtc = new Date(Date.UTC(year, mon - 1, 1, 8));
    const endUtc = new Date(Date.UTC(year, mon, 1, 8));

    const { data: timesheets, error: tsError } = await supabase
        .from("timesheets")
        .select("id, user_id, clock_in, clock_out, duration_minutes")
        .gte("clock_in", startUtc.toISOString())
        .lt("clock_in", endUtc.toISOString())
        .not("clock_out", "is", null);

    if (tsError) {
        console.error("Billing timesheets query error:", tsError);
        return { error: "Failed to fetch timesheet data" };
    }

    const { data: allTenants } = await supabase
        .from("profiles")
        .select("id, company_name, email")
        .eq("role", "tenant")
        .order("company_name");

    const { data: billingPeriods } = await supabase
        .from("billing_periods")
        .select("tenant_id, status")
        .eq("period_month", month);

    const statusMap: Record<string, string> = {};
    (billingPeriods || []).forEach((bp: { tenant_id: string; status: string }) => {
        statusMap[bp.tenant_id] = bp.status;
    });

    const { data: allTimesheetMonths } = await supabase
        .from("timesheets")
        .select("clock_in")
        .not("clock_out", "is", null)
        .order("clock_in", { ascending: false })
        .limit(500);

    const monthSet = new Set<string>();
    const nowPst = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    monthSet.add(`${nowPst.getFullYear()}-${String(nowPst.getMonth() + 1).padStart(2, "0")}`);
    (allTimesheetMonths || []).forEach((ts: { clock_in: string }) => {
        const pst = new Date(new Date(ts.clock_in).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
        monthSet.add(`${pst.getFullYear()}-${String(pst.getMonth() + 1).padStart(2, "0")}`);
    });

    const grouped: Record<string, { minutes: number; sessions: number }> = {};
    (timesheets || []).forEach((ts: { user_id: string; duration_minutes: number | null }) => {
        if (!grouped[ts.user_id]) grouped[ts.user_id] = { minutes: 0, sessions: 0 };
        grouped[ts.user_id].minutes += ts.duration_minutes || 0;
        grouped[ts.user_id].sessions += 1;
    });

    const currentMonthKey = `${nowPst.getFullYear()}-${String(nowPst.getMonth() + 1).padStart(2, "0")}`;
    const isCurrentMonth = month === currentMonthKey;

    const tenants: TenantBillingSummary[] = (allTenants || []).map((t: { id: string; company_name: string; email: string | null }) => {
        const usage = grouped[t.id] || { minutes: 0, sessions: 0 };
        const hours = usage.minutes / 60;
        const cost = calculateTieredCost(hours);
        let billingStatus = statusMap[t.id] as "in_progress" | "pending" | "invoiced" | undefined;
        if (!billingStatus) billingStatus = isCurrentMonth ? "in_progress" : "pending";
        return {
            tenantId: t.id,
            companyName: t.company_name,
            email: t.email,
            totalMinutes: usage.minutes,
            totalHours: hours,
            sessionCount: usage.sessions,
            estimatedCost: cost,
            currentTier: getCurrentTier(hours),
            billingStatus,
        };
    });

    const withUsage = tenants.filter(t => t.sessionCount > 0);
    const totalHours = withUsage.reduce((s, t) => s + t.totalHours, 0);
    const totalCost = withUsage.reduce((s, t) => s + t.estimatedCost, 0);

    return {
        data: {
            month,
            tenants,
            totals: { hours: totalHours, cost: totalCost, activeTenants: withUsage.length },
            availableMonths: Array.from(monthSet).sort().reverse(),
        },
    };
}

/**
 * Returns billing period records for ALL tenants (admin view).
 * Useful for the admin billing page.
 */
export async function getAllBillingPeriods() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") return { error: "Not authorized" };

    const { data, error } = await supabase
        .from("billing_periods")
        .select(`
      id,
      tenant_id,
      period_month,
      status,
      updated_at,
      profiles!billing_periods_tenant_id_fkey (
        company_name,
        contact_name,
        email
      )
    `)
        .order("period_month", { ascending: false });

    if (error) return { error: "Failed to fetch billing periods" };
    return { data };
}

/**
 * Admin-only: update a billing period's status to 'invoiced'.
 * Creates the record if it doesn't exist yet.
 */
export async function markBillingPeriodInvoiced(
    tenantId: string,
    periodMonth: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") return { error: "Not authorized" };

    const { error } = await supabase
        .from("billing_periods")
        .upsert(
            {
                tenant_id: tenantId,
                period_month: periodMonth,
                status: "invoiced",
                updated_by: user.id,
            },
            { onConflict: "tenant_id,period_month" }
        );

    if (error) return { error: "Failed to update billing period" };

    revalidatePath("/admin/billing");
    revalidatePath("/billing");
    return { success: true };
}

/**
 * Admin-only: set a billing period back to 'pending'
 * (e.g., to correct a mistake).
 */
export async function markBillingPeriodPending(
    tenantId: string,
    periodMonth: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") return { error: "Not authorized" };

    const { error } = await supabase
        .from("billing_periods")
        .upsert(
            {
                tenant_id: tenantId,
                period_month: periodMonth,
                status: "pending",
                updated_by: user.id,
            },
            { onConflict: "tenant_id,period_month" }
        );

    if (error) return { error: "Failed to update billing period" };

    revalidatePath("/admin/billing");
    revalidatePath("/billing");
    return { success: true };
}

/**
 * Ensure a billing_period row exists for the given tenant/month.
 * Status defaults based on whether the month is over or still current.
 * Current month → 'in_progress'; past months → 'pending' (if no row exists).
 */
export async function ensureBillingPeriod(
    tenantId: string,
    periodMonth: string,
    defaultStatus: "in_progress" | "pending"
) {
    const supabase = await createClient();

    await supabase
        .from("billing_periods")
        .upsert(
            { tenant_id: tenantId, period_month: periodMonth, status: defaultStatus },
            { onConflict: "tenant_id,period_month", ignoreDuplicates: true }
        );
}
