'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export async function createTicket(prevState: any, formData: FormData) {
    const supabase = await createClient();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as TicketPriority;
    const kitchen_id = formData.get('kitchen_id') as string; // Optional
    const photo_url = formData.get('photo_url') as string; // Optional

    const { data: { user } } = await supabase.auth.getUser();

    if (!title || !description || !user) {
        return { error: 'Missing required fields' };
    }

    const { error } = await supabase
        .from('maintenance_tickets')
        .insert({
            user_id: user.id,
            title,
            description,
            priority: priority || 'medium',
            kitchen_id: kitchen_id || null,
            photo_url: photo_url || null,
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
