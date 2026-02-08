'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export type RequestType = 'maintenance' | 'rule_violation'
export type RequestStatus = 'pending' | 'in_progress' | 'resolved'
export type RequestPriority = 'low' | 'medium' | 'high'

export interface Request {
    id: string
    user_id: string
    type: RequestType
    description: string
    photo_url: string | null
    status: RequestStatus
    priority: RequestPriority
    created_at: string
    updated_at: string
    profiles?: {
        company_name: string
        email: string
    }
}

// Submit a new maintenance or rule violation request
export async function createRequest(formData: FormData): Promise<{ success?: boolean; error?: string }> {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'You must be logged in to submit a request' }
    }

    const type = formData.get('type') as RequestType
    const description = formData.get('description') as string
    const photoFile = formData.get('photo') as File | null

    if (!type || !description) {
        return { error: 'Type and description are required' }
    }

    let photoUrl: string | null = null

    // Upload photo if provided
    if (photoFile && photoFile.size > 0) {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('request-photos')
            .upload(fileName, photoFile)

        if (uploadError) {
            console.error('Photo upload error:', uploadError)
            return { error: 'Failed to upload photo. Please try again.' }
        }

        const { data: urlData } = supabase.storage
            .from('request-photos')
            .getPublicUrl(fileName)

        photoUrl = urlData.publicUrl
    }

    // Insert the request
    const { error } = await supabase
        .from('requests')
        .insert({
            user_id: user.id,
            type,
            description,
            photo_url: photoUrl,
            status: 'pending',
            priority: 'medium'
        })

    if (error) {
        console.error('Request creation error:', error)
        return { error: 'Failed to submit request. Please try again.' }
    }

    revalidatePath('/contact')
    revalidatePath('/admin/requests')
    return { success: true }
}

// Get all requests (admin only)
export async function getRequests(filters?: {
    type?: RequestType
    status?: RequestStatus
}): Promise<Request[]> {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        console.error('Unauthorized: No user logged in')
        return []
    }

    // 2. Verify Admin Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        console.error('Unauthorized: User is not an admin', user.id)
        return []
    }

    // 3. Proceed with Admin Client (Service Role)
    const adminClient = createAdminClient()

    let query = adminClient
        .from('requests')
        .select(`
      *,
      profiles:user_id (
        company_name
      )
    `)
        .order('created_at', { ascending: false })

    if (filters?.type) {
        query = query.eq('type', filters.type)
    }
    if (filters?.status) {
        query = query.eq('status', filters.status)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching requests:', error)
        return []
    }

    return data || []
}

// Update request status or priority (admin only)
export async function updateRequest(
    requestId: string,
    updates: { status?: RequestStatus; priority?: RequestPriority }
): Promise<{ success?: boolean; error?: string }> {
    const supabase = await createClient()

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    // 2. Verify Admin Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return { error: 'Unauthorized: Admin access required' }
    }

    // 3. Proceed with Admin Client
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('requests')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

    if (error) {
        console.error('Error updating request:', error)
        return { error: 'Failed to update request' }
    }

    revalidatePath('/admin/requests')
    return { success: true }
}


