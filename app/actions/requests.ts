'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export type RequestType = 'maintenance' | 'rule_violation' | 'general_question'
export type RequestStatus = 'pending' | 'in_progress' | 'resolved' | 'approved' | 'rejected' | 'open' | 'closed'
export type RequestPriority = 'low' | 'medium' | 'high' | 'critical'
export type RequestSource = 'requests' | 'maintenance_tickets'

export interface Request {
    id: string
    user_id: string
    type: RequestType
    title?: string
    description: string
    photo_url: string | null
    status: RequestStatus
    priority: RequestPriority
    created_at: string
    updated_at: string
    source: RequestSource
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

// Get all requests (admin only) — merges maintenance_tickets + requests tables
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

    // --- Fetch from `requests` table (rule violations) ---
    let requestsQuery = adminClient
        .from('requests')
        .select(`
      *,
      profiles:user_id (
        company_name,
        email
      )
    `)
        .order('created_at', { ascending: false })

    if (filters?.type && filters.type !== 'maintenance') {
        requestsQuery = requestsQuery.eq('type', filters.type)
    }
    if (filters?.status) {
        requestsQuery = requestsQuery.eq('status', filters.status)
    }

    const { data: standardRequestsData, error: requestsError } = await requestsQuery
    if (requestsError) {
        console.error('Error fetching requests:', requestsError)
    }

    const standardRequests: Request[] = (standardRequestsData || []).map((r: any) => ({
        ...r,
        source: 'requests' as RequestSource,
    }))

    // --- Fetch from `maintenance_tickets` table ---
    let ticketsQuery = adminClient
        .from('maintenance_tickets')
        .select(`
      *,
      profiles:user_id (
        company_name,
        email
      )
    `)
        .order('created_at', { ascending: false })

    if (filters?.status) {
        // Map statuses: maintenance_tickets uses open/in_progress/resolved/closed
        // requests uses pending/in_progress/resolved
        ticketsQuery = ticketsQuery.eq('status', filters.status)
    }

    const { data: ticketsData, error: ticketsError } = await ticketsQuery
    if (ticketsError) {
        console.error('Error fetching maintenance_tickets:', ticketsError)
    }

    // Normalize maintenance_tickets to the Request interface
    const maintenanceRequests: Request[] = (ticketsData || []).map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        type: 'maintenance' as RequestType,
        title: t.title,
        description: t.title ? `**${t.title}**\n\n${t.description}` : t.description,
        photo_url: t.photo_url || null,
        // Map ticket statuses to request statuses
        status: (t.status === 'open' ? 'pending' : t.status) as RequestStatus,
        priority: (t.priority || 'medium') as RequestPriority,
        created_at: t.created_at,
        updated_at: t.updated_at || t.created_at,
        source: 'maintenance_tickets' as RequestSource,
        profiles: t.profiles,
    }))

    // --- Combine, filter, sort ---
    let allRequests = [...standardRequests, ...maintenanceRequests]

    // Apply type filter across combined list
    if (filters?.type) {
        allRequests = allRequests.filter(r => r.type === filters.type)
    }

    // Sort by date desc
    allRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return allRequests
}

// Update request status or priority (admin only)
export async function updateRequest(
    req: Request,
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

    if (req.source === 'maintenance_tickets') {
        // Map request statuses back to ticket statuses
        const ticketUpdates: any = { ...updates }
        if (updates.status === 'pending') ticketUpdates.status = 'open'
        if (updates.status === 'resolved') ticketUpdates.resolved_at = new Date().toISOString()

        const { error } = await adminClient
            .from('maintenance_tickets')
            .update(ticketUpdates)
            .eq('id', req.id)

        if (error) {
            console.error('Error updating maintenance_ticket:', error)
            return { error: 'Failed to update ticket' }
        }
    } else {
        // Standard requests table
        const { error } = await adminClient
            .from('requests')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.id)

        if (error) {
            console.error('Error updating request:', error)
            return { error: 'Failed to update request' }
        }
    }

    revalidatePath('/admin/requests')
    revalidatePath('/maintenance')
    return { success: true }
}
