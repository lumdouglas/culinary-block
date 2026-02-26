import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    const searchTerm = 'tenant-test-1770657974287';

    // 1. Find the test tenant
    const { data: profiles, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${searchTerm}%`)
        .limit(1);

    if (profileErr || !profiles || profiles.length === 0) {
        console.error("Could not find the test tenant using email containing:", searchTerm);
        return;
    }

    const tenantId = profiles[0].id;
    console.log(`Found tenant: ${profiles[0].email} (${tenantId})`);

    // 2. Generate Timesheets for December 2025 and January 2026
    console.log('Generating timesheets...');
    const timesheetsToInsert = [
        // December 2025 (4 shifts)
        { user_id: tenantId, clock_in: '2025-12-05T08:00:00Z', clock_out: '2025-12-05T12:00:00Z', duration_minutes: 240 },
        { user_id: tenantId, clock_in: '2025-12-10T09:00:00Z', clock_out: '2025-12-10T14:30:00Z', duration_minutes: 330 },
        { user_id: tenantId, clock_in: '2025-12-15T10:00:00Z', clock_out: '2025-12-15T15:00:00Z', duration_minutes: 300 },
        { user_id: tenantId, clock_in: '2025-12-20T08:30:00Z', clock_out: '2025-12-20T11:45:00Z', duration_minutes: 195 },
        // January 2026 (5 shifts)
        { user_id: tenantId, clock_in: '2026-01-04T07:00:00Z', clock_out: '2026-01-04T13:00:00Z', duration_minutes: 360 },
        { user_id: tenantId, clock_in: '2026-01-11T08:00:00Z', clock_out: '2026-01-11T12:00:00Z', duration_minutes: 240 },
        { user_id: tenantId, clock_in: '2026-01-18T09:30:00Z', clock_out: '2026-01-18T16:00:00Z', duration_minutes: 390 },
        { user_id: tenantId, clock_in: '2026-01-22T10:00:00Z', clock_out: '2026-01-22T14:00:00Z', duration_minutes: 240 },
        { user_id: tenantId, clock_in: '2026-01-29T08:00:00Z', clock_out: '2026-01-29T11:30:00Z', duration_minutes: 210 },
    ];

    const { error: tsError } = await supabase.from('timesheets').insert(timesheetsToInsert);
    if (tsError) {
        console.error("Error inserting timesheets:", tsError);
        return;
    }

    // 3. Generate Invoices
    console.log('Generating invoices...');
    const invoicesToInsert = [
        {
            tenant_id: tenantId,
            status: 'paid',
            due_date: '2026-01-15T00:00:00Z',
            paid_at: '2026-01-10T00:00:00Z',
            invoice_number: 'INV-2025-12',
            subtotal: 450.00,
            tax: 36.00,
            total: 486.00,
            notes: 'December 2025 Kitchen Rental & Usage',
            created_at: '2026-01-01T08:00:00Z',
            updated_at: '2026-01-10T08:00:00Z'
        },
        {
            tenant_id: tenantId,
            status: 'paid',
            due_date: '2026-02-15T00:00:00Z',
            paid_at: '2026-02-12T00:00:00Z',
            invoice_number: 'INV-2026-01',
            subtotal: 620.00,
            tax: 49.60,
            total: 669.60,
            notes: 'January 2026 Kitchen Rental & Usage',
            created_at: '2026-02-01T08:00:00Z',
            updated_at: '2026-02-12T08:00:00Z'
        }
    ];

    const { data: insertedInvoices, error: invError } = await supabase
        .from('invoices')
        .insert(invoicesToInsert)
        .select();

    if (invError || !insertedInvoices) {
        console.error("Error inserting invoices:", invError);
        return;
    }

    // 4. Generate Invoice Lines
    console.log('Generating invoice lines...');
    const decInvoiceId = insertedInvoices.find(i => i.invoice_number === 'INV-2025-12')?.id;
    const janInvoiceId = insertedInvoices.find(i => i.invoice_number === 'INV-2026-01')?.id;

    const invoiceLinesToInsert = [
        // December lines
        { invoice_id: decInvoiceId, description: 'Base Monthly Membership', quantity: 1, unit_price: 150.00, amount: 150.00 },
        { invoice_id: decInvoiceId, description: 'Hourly Kitchen Rental (17.75 hours @ $16.90/hr)', quantity: 17.75, unit_price: 16.90, amount: 300.00 },
        // January lines
        { invoice_id: janInvoiceId, description: 'Base Monthly Membership', quantity: 1, unit_price: 150.00, amount: 150.00 },
        { invoice_id: janInvoiceId, description: 'Hourly Kitchen Rental (24 hours @ $19.58/hr)', quantity: 24, unit_price: 19.58, amount: 470.00 },
    ];

    const { error: linesError } = await supabase.from('invoice_lines').insert(invoiceLinesToInsert);

    if (linesError) {
        console.error("Error inserting invoice lines:", linesError);
        return;
    }

    console.log("Successfully seeded timesheets, invoices, and invoice lines for Dec 2025 and Jan 2026!");
}

main().catch(console.error);
