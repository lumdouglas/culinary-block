import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { updateInvoiceStatus } from "@/app/actions/invoicing";

export default async function InvoiceDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: invoice } = await supabase
        .from("invoices")
        .select("*, profiles:tenant_id(company_name), invoice_lines(*)")
        .eq("id", id)
        .single();

    if (!invoice) {
        notFound();
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/billing/invoices"
                    className="text-sm text-slate-500 hover:text-slate-800 flex items-center"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Invoices
                </Link>
            </div>

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Invoice {invoice.invoice_number}
                    </h1>
                    <p className="text-slate-500">
                        Issued to {invoice.profiles?.company_name}
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Simple status actions for now */}
                    <form action={async () => {
                        'use server';
                        await updateInvoiceStatus(id, 'void');
                    }}>
                        <Button variant="outline" type="submit">Void</Button>
                    </form>
                    {invoice.status !== 'paid' && (
                        <form action={async () => {
                            'use server';
                            await updateInvoiceStatus(id, 'paid');
                        }}>
                            <Button type="submit">Mark as Paid</Button>
                        </form>
                    )}
                </div>
            </div>

            <div className="grid gap-6">
                {/* Status Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Badge variant="outline" className="text-lg px-3 py-1 capitalize">
                            {invoice.status}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Due Date: {format(new Date(invoice.due_date), "PPP")}
                        </div>
                        {invoice.paid_at && (
                            <div className="text-sm text-green-600 font-medium mt-1">
                                Paid on {format(new Date(invoice.paid_at), "PPP")}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Line Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Line Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {invoice.invoice_lines?.map((line: any) => (
                                <div
                                    key={line.id}
                                    className="flex justify-between items-center border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                                >
                                    <div>
                                        <div className="font-medium">{line.description}</div>
                                        <div className="text-sm text-slate-500">
                                            {line.quantity} x ${line.unit_price.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="font-semibold">
                                        ${line.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col items-end gap-2">
                            <div className="flex justify-between w-48 text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span>${invoice.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between w-48 text-sm">
                                <span className="text-slate-500">Tax</span>
                                <span>${invoice.tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between w-48 text-lg font-bold mt-2">
                                <span>Total</span>
                                <span>${invoice.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
