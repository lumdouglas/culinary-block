"use server"

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

    revalidatePath('/admin/timesheets');
    revalidatePath('/timesheets');
    revalidatePath('/billing');
    return { success: true };
}
