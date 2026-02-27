'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export async function createTicket(prevState: any, formData: FormData) {
    const supabase = await createClient();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as TicketPriority;
    const kitchen_id = formData.get('kitchen_id') as string;
    const photoFile = formData.get('photo') as File | null;

    const { data: { user } } = await supabase.auth.getUser();

    if (!title || !description || !user) {
        return { error: 'Missing required fields' };
    }

    // Upload photo server-side if provided
    let photo_url: string | null = null;

    if (photoFile && photoFile.size > 0) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('request-photos')
            .upload(fileName, photoFile);

        if (uploadError) {
            console.error('Photo upload error:', uploadError);
            return { error: `Failed to upload photo: ${uploadError.message}` };
        }

        const { data: urlData } = supabase.storage
            .from('request-photos')
            .getPublicUrl(fileName);

        photo_url = urlData.publicUrl;
    }

    const { error } = await supabase
        .from('maintenance_tickets')
        .insert({
            user_id: user.id,
            title,
            description,
            priority: priority || 'medium',
            kitchen_id: kitchen_id || null,
            photo_url,
            status: 'open',
        });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/maintenance');
    return { success: true };
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
    const supabase = await createClient();

    const updateData: any = { status };
    if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('maintenance_tickets')
        .update(updateData)
        .eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/maintenance/${id}`);
    revalidatePath('/maintenance');
    return { success: true };
}
