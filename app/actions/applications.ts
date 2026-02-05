"use server"

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveApplication(applicationId: string, email: string) {
  const supabase = await createClient();

  // 1. Send Supabase Auth Invite
  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/signup`
  });

  if (authError) return { error: authError.message };

  // 2. Update Application Status
  const { error: appError } = await supabase
    .from('applications')
    .update({ 
      status: 'approved',
      user_id: authData.user.id 
    })
    .eq('id', applicationId);

  if (appError) return { error: appError.message };

  revalidatePath('/admin/applications');
  return { success: true };
}