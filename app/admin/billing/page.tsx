"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import {
    getAdminBillingData,
    markBillingPeriodInvoiced,
    markBillingPeriodPending,
    type TenantBillingSummary,
    type AdminBillingData,
} from "@/app/actions/billing"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
    Receipt, ChevronLeft, ChevronRight, DollarSign, Clock, Users, RefreshCw,
} from "lucide-react"

function StatusBadge({ status }: { status: string }) {
    if (status === "in_progress")
        return <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50">In Progress</Badge>
    if (status === "pending")
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>
    if (status === "invoiced")
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Invoiced</Badge>
    return <Badge variant="outline">{status}</Badge>
}

function formatMonthLabel(month: string) {
    const [y, m] = month.split("-")
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function getAdjacentMonth(month: string, offset: number) {
    const [y, m] = month.split("-").map(Number)
    const d = new Date(y, m - 1 + offset, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function getCurrentMonthKey() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }))
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

/** Matches `handle_new_user` placeholder when no approved application (see migrations). */
const PLACEHOLDER_COMPANY_NAME = "New User"

export default function AdminBillingPage() {
    const [month, setMonth] = useState(getCurrentMonthKey)
    const [data, setData] = useState<AdminBillingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [tenantFilter, setTenantFilter] = useState<string>("all")
    const [isPending, startTransition] = useTransition()

    const load = useCallback(async (m: string) => {
        setLoading(true)
        const result = await getAdminBillingData(m)
        if (result.error) {
            toast.error(result.error)
        } else if (result.data) {
            setData(result.data)
        }
        setLoading(false)
    }, [])

    useEffect(() => { load(month) }, [month, load])

    useEffect(() => {
        if (tenantFilter === "all" || !data) return
        const row = data.tenants.find((t) => t.tenantId === tenantFilter)
        if (row?.companyName === PLACEHOLDER_COMPANY_NAME) {
            setTenantFilter("all")
        }
    }, [data, tenantFilter])

    const navigateMonth = (offset: number) => {
        setMonth(prev => getAdjacentMonth(prev, offset))
    }

    const handleMarkInvoiced = (tenantId: string) => {
        startTransition(async () => {
            const result = await markBillingPeriodInvoiced(tenantId, month)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Marked as Invoiced")
                setData(prev => prev ? {
                    ...prev,
                    tenants: prev.tenants.map(t =>
                        t.tenantId === tenantId ? { ...t, billingStatus: "invoiced" } : t
                    ),
                } : prev)
            }
        })
    }

    const handleMarkPending = (tenantId: string) => {
        startTransition(async () => {
            const result = await markBillingPeriodPending(tenantId, month)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Reset to Pending")
                setData(prev => prev ? {
                    ...prev,
                    tenants: prev.tenants.map(t =>
                        t.tenantId === tenantId ? { ...t, billingStatus: "pending" } : t
                    ),
                } : prev)
            }
        })
    }

    const isCurrentMonth = month === getCurrentMonthKey()
    const isFutureMonth = month > getCurrentMonthKey()

    const displayTenants: TenantBillingSummary[] = data
        ? tenantFilter === "all"
            ? data.tenants.filter(t => t.sessionCount > 0 || t.billingStatus !== (isCurrentMonth ? "in_progress" : "pending"))
            : data.tenants.filter(t => t.tenantId === tenantFilter)
        : []

    const allTenantsForFilter = (data?.tenants ?? []).filter(
        (t) => t.companyName !== PLACEHOLDER_COMPANY_NAME,
    )

    const displayTotalHours = displayTenants.reduce((s, t) => s + t.totalHours, 0)
    const displayTotalCost = displayTenants.reduce((s, t) => s + t.estimatedCost, 0)

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto py-12 px-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                            <Receipt className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-4xl font-bold">Billing Management</h1>
                    </div>
                    <p className="text-slate-600 ml-14">
                        Review tenant usage, costs, and mark billing periods as invoiced.
                    </p>
                </div>

                {/* Month navigator + filter row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigateMonth(-1)}
                            disabled={loading}
                            data-testid="prev-month"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="min-w-[200px] text-center">
                            <h2 className="text-xl font-bold text-slate-900">{formatMonthLabel(month)}</h2>
                            {isCurrentMonth && (
                                <span className="text-xs text-emerald-600 font-medium">Current Month</span>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => navigateMonth(1)}
                            disabled={loading || isFutureMonth}
                            data-testid="next-month"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        {!isCurrentMonth && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 text-emerald-700"
                                onClick={() => setMonth(getCurrentMonthKey())}
                            >
                                Today
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">Filter by Tenant:</span>
                            <Select value={tenantFilter} onValueChange={setTenantFilter}>
                                <SelectTrigger className="w-[250px] bg-white" data-testid="tenant-filter">
                                    <SelectValue placeholder="All Tenants" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tenants</SelectItem>
                                    {allTenantsForFilter.map(t => (
                                        <SelectItem key={t.tenantId} value={t.tenantId}>
                                            {t.companyName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => load(month)} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                {data && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="p-5 bg-white border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 p-2 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Estimated Revenue</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        ${displayTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-5 bg-white border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Total Hours</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {displayTotalHours.toFixed(1)} hrs
                                    </p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-5 bg-white border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="bg-violet-100 p-2 rounded-lg">
                                    <Users className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Active Tenants</p>
                                    <p className="text-2xl font-bold text-slate-900">
                                        {data.totals.activeTenants}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Billing Table */}
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading billing data...</div>
                ) : displayTenants.length === 0 ? (
                    <Card className="p-8 text-center text-slate-500">
                        No tenant usage found for {formatMonthLabel(month)}.
                    </Card>
                ) : (
                    <div className="rounded-md border bg-white overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-100 border-b border-slate-300">
                                <TableRow className="border-slate-300 hover:bg-transparent">
                                    <TableHead className="text-slate-900 font-bold">Tenant</TableHead>
                                    <TableHead className="text-slate-900 font-bold text-right">Hours</TableHead>
                                    <TableHead className="text-slate-900 font-bold text-right">Sessions</TableHead>
                                    <TableHead className="text-slate-900 font-bold text-center">Rate Tier</TableHead>
                                    <TableHead className="text-slate-900 font-bold text-right">Est. Cost</TableHead>
                                    <TableHead className="text-slate-900 font-bold text-center">Status</TableHead>
                                    <TableHead className="text-slate-900 font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayTenants.map(tenant => (
                                    <TableRow key={tenant.tenantId} className="border-b border-slate-200">
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{tenant.companyName}</div>
                                            <div className="text-xs text-slate-500">{tenant.email}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-slate-900">
                                            {tenant.totalHours.toFixed(1)}
                                        </TableCell>
                                        <TableCell className="text-right text-slate-700">
                                            {tenant.sessionCount}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {tenant.currentTier}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">
                                            ${tenant.estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={tenant.billingStatus} />
                                        </TableCell>
                                        <TableCell>
                                            {tenant.billingStatus === "pending" && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                                                    disabled={isPending}
                                                    onClick={() => handleMarkInvoiced(tenant.tenantId)}
                                                    data-testid={`mark-invoiced-${tenant.tenantId}`}
                                                >
                                                    Mark Invoiced
                                                </Button>
                                            )}
                                            {tenant.billingStatus === "invoiced" && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-slate-500 hover:text-amber-700"
                                                    disabled={isPending}
                                                    onClick={() => handleMarkPending(tenant.tenantId)}
                                                >
                                                    Undo
                                                </Button>
                                            )}
                                            {tenant.billingStatus === "in_progress" && (
                                                <span className="text-xs text-slate-400 italic">In progress</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {/* Totals row */}
                                {displayTenants.length > 1 && (
                                    <TableRow className="bg-slate-50 border-t-2 border-slate-300">
                                        <TableCell className="font-bold text-slate-900">
                                            Total ({displayTenants.length} tenants)
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-900">
                                            {displayTotalHours.toFixed(1)}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-slate-700">
                                            {displayTenants.reduce((s, t) => s + t.sessionCount, 0)}
                                        </TableCell>
                                        <TableCell />
                                        <TableCell className="text-right font-bold text-emerald-700 text-lg">
                                            ${displayTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell />
                                        <TableCell />
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <p className="text-xs text-slate-500 mt-4">
                    Rates: First 20hrs @ $50/hr, 21–100hrs @ $40/hr, 100+ hrs @ $30/hr.
                    Invoices are sent via QuickBooks at the end of each billing period.
                </p>
            </div>
        </div>
    )
}
