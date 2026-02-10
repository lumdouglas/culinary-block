'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    unit_price: number;
}

export async function createInvoice(prevState: any, formData: FormData) {
    const supabase = await createClient();

    const tenantId = formData.get('tenant_id') as string;
    const dueDate = formData.get('due_date') as string;
    const notes = formData.get('notes') as string;

    // Parse line items from formData (client-side should stringify them)
    const lineItemsJson = formData.get('line_items') as string;
    let lineItems: InvoiceLineItem[] = [];
    try {
        lineItems = JSON.parse(lineItemsJson);
    } catch (e) {
        return { error: 'Invalid line items format' };
    }

    if (!tenantId || !dueDate || lineItems.length === 0) {
        return { error: 'Missing required fields' };
    }

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxRate = 0; // Hardcoded for now, could be dynamic
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // 1. Create Invoice
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
            tenant_id: tenantId,
            due_date: dueDate,
            status: 'draft', // Default to draft
            subtotal,
            tax,
            total,
            notes,
            invoice_number: `INV-${Date.now().toString().slice(-6)}`, // Simple ID generation
        })
        .select()
        .single();

    if (invoiceError) {
        return { error: 'Failed to create invoice: ' + invoiceError.message };
    }

    // 2. Create Invoice Lines
    const formattedLines = lineItems.map((item) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
    }));

    const { error: linesError } = await supabase
        .from('invoice_lines')
        .insert(formattedLines);

    if (linesError) {
        // Cleanup if lines fail (optional but good practice)
        await supabase.from('invoices').delete().eq('id', invoice.id);
        return { error: 'Failed to create invoice lines: ' + linesError.message };
    }

    revalidatePath('/billing/invoices');
    redirect(`/billing/invoices/${invoice.id}`);
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
    const supabase = await createClient();

    const updateData: any = { status };
    if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath(`/billing/invoices/${id}`);
    revalidatePath('/billing/invoices');
    return { success: true };
}

export async function deleteInvoice(id: string) {
    const supabase = await createClient();

    // Only allow deleting drafts? Or voids?
    // enforcing RLS which allows admins to do anything.

    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/billing/invoices');
    redirect('/billing/invoices');
}
