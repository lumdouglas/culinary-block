"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
