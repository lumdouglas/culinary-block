import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus } from "lucide-react";

export default async function InvoicesPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
    const isAdmin = profile?.role === 'admin';

    let query = supabase
        .from("invoices")
        .select("*, profiles:tenant_id(company_name)")
        .order("created_at", { ascending: false });

    if (!isAdmin && user) {
        query = query.eq("tenant_id", user.id);
    }

    const { data: invoices } = await query;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isAdmin ? "Invoices" : "My Billing"}
                    </h1>
                    <p className="text-slate-500">
                        {isAdmin ? "Manage billing and payments" : "View and download your past invoices"}
                    </p>
                </div>
                {isAdmin && (
                    <Link href="/billing/invoices/new">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Invoice
                        </Button>
                    </Link>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 [&_th]:text-slate-700">
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            {isAdmin && <TableHead>Tenant</TableHead>}
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-slate-500">
                                    {isAdmin ? "No invoices found. Create one to get started." : "You have no invoices at this time."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices?.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium text-slate-900">
                                        {invoice.invoice_number}
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-slate-900">
                                            {invoice.profiles?.company_name || "Unknown Tenant"}
                                        </TableCell>
                                    )}
                                    <TableCell className="text-slate-700">${invoice.total.toFixed(2)}</TableCell>
                                    <TableCell className="text-slate-700">
                                        {invoice.due_date
                                            ? format(new Date(invoice.due_date), "MMM d, yyyy")
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={invoice.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/billing/invoices/${invoice.id}`}>
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        draft: "bg-slate-100 text-slate-700",
        open: "bg-blue-100 text-blue-700",
        paid: "bg-green-100 text-green-700",
        void: "bg-red-100 text-red-700",
        uncollectible: "bg-orange-100 text-orange-700",
    };

    return (
        <Badge
            variant="secondary"
            className={styles[status as keyof typeof styles] || "bg-gray-100"}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}
