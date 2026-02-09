
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { status, resolutionNotes } = body;

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Start transaction (conceptually - Supabase doesn't have multi-statement tx API in JS yet easily, 
        // so we will do it sequentially and hope for the best, or use RPC if we had it.
        // For now, simple sequential operations.)

        // 1. Get the request details
        const { data: request, error: reqError } = await supabase
            .from('timesheet_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (reqError || !request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (request.status !== 'pending') {
            return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
        }

        // 2. If valid, process the change
        if (status === 'approved') {
            const { type, timesheet_id, clock_in, clock_out, user_id } = request;

            if (type === 'create') {
                const { error: insertError } = await supabase
                    .from('timesheets')
                    .insert({
                        user_id,
                        clock_in,
                        clock_out,
                        notes: 'Created via admin approval of request'
                    });
                if (insertError) throw insertError;

            } else if (type === 'update' && timesheet_id) {
                const updates: any = {};
                if (clock_in) updates.clock_in = clock_in;
                if (clock_out) updates.clock_out = clock_out;

                const { error: updateError } = await supabase
                    .from('timesheets')
                    .update(updates)
                    .eq('id', timesheet_id);
                if (updateError) throw updateError;
            } else if (type === 'delete' && timesheet_id) {
                const { error: deleteError } = await supabase
                    .from('timesheets')
                    .delete()
                    .eq('id', timesheet_id);
                if (deleteError) throw deleteError;
            }
        }

        // 3. Update request status
        const { error: updateReqError } = await supabase
            .from('timesheet_requests')
            .update({
                status,
                admin_notes: resolutionNotes,
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateReqError) {
            return NextResponse.json({ error: updateReqError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error('Error processing request:', err);
        return NextResponse.json({ error: err.message || 'Failed to process' }, { status: 500 });
    }
}
