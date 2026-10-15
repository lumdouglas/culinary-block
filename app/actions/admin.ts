"use server"

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const inviteTenantSchema = z.object({
    email: z.string().trim().email("Enter a valid email"),
    company_name: z.string().trim().min(1, "Company name is required"),
    contact_name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
});

export type InviteTenantFormValues = z.infer<typeof inviteTenantSchema>;

/**
 * Admin-initiated tenant onboarding. Applicants are no longer "approved" in bulk;
 * when someone becomes a tenant, the admin invites them directly.
 */
export async function inviteTenant(values: InviteTenantFormValues) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') return { error: "Not authorized" };

    const parsed = inviteTenantSchema.safeParse(values);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { email, company_name, contact_name, phone } = parsed.data;

    const adminSupabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
        console.error('NEXT_PUBLIC_SITE_URL is not set — invite links will be broken. Set it in Vercel env vars.');
    }

    const { data: invited, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
        email,
        {
            data: { company_name, phone: phone || null },
            redirectTo: `${siteUrl || 'https://www.culinaryblock.com'}/auth/callback?next=/account-setup`,
        }
    );

    if (inviteError || !invited.user) {
        console.error('Tenant invitation error:', inviteError);
        return { error: `Failed to send invitation: ${inviteError?.message ?? 'unknown error'}` };
    }

    // The handle_new_user trigger creates an inactive "New User" profile when no
    // approved application exists, so fill it in and activate it here.
    const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({
            company_name,
            contact_name: contact_name || null,
            phone: phone || null,
            role: 'tenant',
            is_active: true,
        })
        .eq('id', invited.user.id);

    if (profileError) {
        console.error('Tenant profile update error:', profileError);
        return { error: "Invitation sent, but failed to set up the tenant profile. Edit it from the tenants list." };
    }

    revalidatePath('/admin/tenants');
    return { success: true };
}

export async function resendInvite(applicationId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') return { error: "Not authorized" };

    const { data: application, error: fetchError } = await supabase
        .from('applications')
        .select('id, email, company_name, phone, status')
        .eq('id', applicationId)
        .single();

    if (fetchError || !application) return { error: "Application not found" };
    if (application.status !== 'approved') return { error: "Can only resend invites for approved applications" };

    const adminSupabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

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
        console.error('Resend invite error:', inviteError);
        return { error: `Failed to resend invitation: ${inviteError.message}` };
    }

    // Update invited_at timestamp
    await supabase
        .from('applications')
        .update({ invited_at: new Date().toISOString() })
        .eq('id', applicationId);

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
        .select('id, email, company_name, phone, address, contact_first_name, contact_last_name, website, years_in_operation, social_media, cuisine_type, kitchen_use_description, usage_hours, equipment_needed, status, submitted_at, reviewed_at, reviewed_by, notes, invited_at')
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

export async function getTenants(options?: { activeOnly?: boolean }) {
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
        .from('profiles')
        .select('id, role, company_name, contact_name, email, phone, address, is_active, business_type, business_description, notification_email')
        .eq('role', 'tenant')
        .order('company_name', { ascending: true });

    if (options?.activeOnly) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
        console.error("getTenants query error:", JSON.stringify(error));
        return { error: `Failed to fetch tenants: ${error.message}` };
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
