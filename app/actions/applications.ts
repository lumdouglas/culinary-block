"use server"

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveApplication(applicationId: string, email: string) {
  const supabase = await createClient();

  // 1. Send Supabase Auth Invite
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.culinaryblock.com';
  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/settings`
  });

  if (authError) return { error: authError.message };

  // 2. Get current admin user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Unauthorized" };

  // 3. Update Application Status
  const { error: appError } = await supabase
    .from('applications')
    .update({
      status: 'approved',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', applicationId);

  if (appError) return { error: appError.message };

  revalidatePath('/admin/applications');
  return { success: true };
}