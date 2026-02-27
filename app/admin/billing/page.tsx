"use client"

import { useEffect, useState, useTransition } from "react";
import { getAllBillingPeriods, markBillingPeriodInvoiced, markBillingPeriodPending } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Receipt, RefreshCw } from "lucide-react";

type BillingPeriod = {
    id: string;
    tenant_id: string;
    period_month: string;
    status: string;
    updated_at: string;
    profiles: {
        company_name: string;
        contact_name: string | null;
        email: string;
    } | null;
};

function StatusBadge({ status }: { status: string }) {
    if (status === 'in_progress') {
        return <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50">In Progress</Badge>;
    }
    if (status === 'pending') {
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
    }
    if (status === 'invoiced') {
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Invoiced</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
}

export default function AdminBillingPage() {
    const [periods, setPeriods] = useState<BillingPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    const loadPeriods = async () => {
        setLoading(true);
        const result = await getAllBillingPeriods();
        if (result.error) {
            toast.error(result.error);
        } else if (result.data) {
            setPeriods(result.data as unknown as BillingPeriod[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadPeriods();
    }, []);

    const handleMarkInvoiced = (tenantId: string, periodMonth: string) => {
        startTransition(async () => {
            const result = await markBillingPeriodInvoiced(tenantId, periodMonth);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Marked as Invoiced");
                setPeriods(prev =>
                    prev.map(p =>
                        p.tenant_id === tenantId && p.period_month === periodMonth
                            ? { ...p, status: 'invoiced' }
                            : p
                    )
                );
            }
        });
    };

    const handleMarkPending = (tenantId: string, periodMonth: string) => {
        startTransition(async () => {
            const result = await markBillingPeriodPending(tenantId, periodMonth);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Reset to Pending");
                setPeriods(prev =>
                    prev.map(p =>
                        p.tenant_id === tenantId && p.period_month === periodMonth
                            ? { ...p, status: 'pending' }
                            : p
                    )
                );
            }
        });
    };

    const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    };

    const pendingCount = periods.filter(p => p.status === 'pending').length;
    const invoicedCount = periods.filter(p => p.status === 'invoiced').length;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto py-12 px-6">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                            <Receipt className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-4xl font-bold">Billing Management</h1>
                    </div>
                    <p className="text-slate-600 ml-14">
                        Review tenant billing periods and mark them as invoiced once you've sent the invoice through QuickBooks.
                    </p>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-6 flex-wrap">
                    <Card className="p-4 px-6 bg-white border-slate-200">
                        <p className="text-sm text-slate-500 font-medium">Pending Invoice</p>
                        <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
                    </Card>
                    <Card className="p-4 px-6 bg-white border-slate-200">
                        <p className="text-sm text-slate-500 font-medium">Invoiced</p>
                        <p className="text-2xl font-bold text-emerald-700">{invoicedCount}</p>
                    </Card>
                    <div className="flex items-end ml-auto">
                        <Button variant="outline" size="sm" onClick={loadPeriods} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading billing periods...</div>
                ) : periods.length === 0 ? (
                    <Card className="p-8 text-center text-slate-500">
                        No billing periods found. Periods are created automatically from tenant timesheet usage.
                    </Card>
                ) : (
                    <div className="rounded-md border bg-white overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100 border-b border-slate-300">
                                <TableRow className="border-slate-300 hover:bg-transparent">
                                    <TableHead className="text-slate-900 font-bold">Tenant</TableHead>
                                    <TableHead className="text-slate-900 font-bold">Email</TableHead>
                                    <TableHead className="text-slate-900 font-bold">Billing Month</TableHead>
                                    <TableHead className="text-slate-900 font-bold">Status</TableHead>
                                    <TableHead className="text-slate-900 font-bold">Last Updated</TableHead>
                                    <TableHead className="text-slate-900 font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {periods.map((period) => (
                                    <TableRow key={period.id} className="border-b border-slate-200">
                                        <TableCell className="font-medium text-slate-900">
                                            {period.profiles?.company_name ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm">
                                            {period.profiles?.email ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-slate-900">
                                            {formatMonth(period.period_month)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={period.status} />
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {new Date(period.updated_at).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {period.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                                                    disabled={isPending}
                                                    onClick={() => handleMarkInvoiced(period.tenant_id, period.period_month)}
                                                >
                                                    Mark Invoiced
                                                </Button>
                                            )}
                                            {period.status === 'invoiced' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-slate-500 hover:text-amber-700"
                                                    disabled={isPending}
                                                    onClick={() => handleMarkPending(period.tenant_id, period.period_month)}
                                                >
                                                    Undo
                                                </Button>
                                            )}
                                            {period.status === 'in_progress' && (
                                                <span className="text-xs text-slate-400 italic">Month in progress</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
