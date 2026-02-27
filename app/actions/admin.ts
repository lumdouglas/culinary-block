"use server"

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function approveApplication(applicationId: string) {
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

    // Get application details
    const { data: application, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

    if (fetchError || !application) {
        return { error: "Application not found" };
    }

    // 1. Update application status first so the Postgres trigger finds it when the user is created
    const { error: updateError } = await supabase
        .from('applications')
        .update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            invited_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

    if (updateError) {
        return { error: "Failed to update application status" };
    }

    // 2. Send Supabase Auth invitation (requires service role key)
    const adminSupabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
        console.error('NEXT_PUBLIC_SITE_URL is not set — invite links will be broken. Set it in Vercel env vars.');
    }
    const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
        application.email,
        {
            data: {
                company_name: application.company_name,
                phone: application.phone,
            },
            redirectTo: `${siteUrl || 'https://www.culinaryblock.com'}/auth/callback?next=/account-setup`,
        }
    );

    if (inviteError) {
        console.error('Invitation error:', inviteError);
        // We could revert the application status here, but for now we'll just return the error
        return { error: `Application approved but failed to send invitation: ${inviteError.message}` };
    }

    revalidatePath('/admin/applications');
    return { success: true };
}

export async function rejectApplication(applicationId: string, reason?: string) {
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

    // Update application status
    const { error: updateError } = await supabase
        .from('applications')
        .update({
            status: 'rejected',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            notes: reason || 'Application rejected',
        })
        .eq('id', applicationId);

    if (updateError) {
        return { error: "Failed to update application status" };
    }

    revalidatePath('/admin/applications');
    return { success: true };
}

export async function getApplications(status?: string) {
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

    let query = supabase
        .from('applications')
        .select('*')
        .order('submitted_at', { ascending: false });

    if (status && status !== 'all') {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        return { error: "Failed to fetch applications" };
    }

    return { data };
}

export async function getTenants() {
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

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .order('company_name', { ascending: true });

    if (error) {
        return { error: "Failed to fetch tenants" };
    }

    return { data };
}

export async function toggleTenantActive(tenantId: string, isActive: boolean) {
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

    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', tenantId);

    if (updateError) {
        return { error: "Failed to update tenant status" };
    }

    revalidatePath('/admin/tenants');
    revalidatePath('/kiosk');
    return { success: true };
}
