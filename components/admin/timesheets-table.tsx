"use client"

import { useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { verifyTimesheets, adminDeleteTimesheet } from "@/app/actions/timesheets"
import { toast } from "sonner"
import { CheckCircle2, Loader2, Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { TenantFilter } from "./tenant-filter"
import {
    TimesheetEditDialog,
    type Kitchen,
    type Tenant,
    type TimesheetEntry,
} from "./timesheet-edit-dialog"

interface TimesheetsTableProps {
    initialTimesheets: TimesheetEntry[]
    tenants: Tenant[]
    kitchens: Kitchen[]
    selectedTenantId?: string
    selectedMonth: string
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

export function AdminTimesheetsTable({
    initialTimesheets,
    tenants,
    kitchens,
    selectedTenantId,
    selectedMonth,
}: TimesheetsTableProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const navigateMonth = (offset: number) => {
        const newMonth = getAdjacentMonth(selectedMonth, offset)
        const params = new URLSearchParams(searchParams.toString())
        params.set("month", newMonth)
        // Clear tenant filter when navigating months to avoid confusion
        router.push(`${pathname}?${params.toString()}`)
    }

    const isCurrentMonth = selectedMonth === getCurrentMonthKey()
    const isFutureMonth  = selectedMonth > getCurrentMonthKey()
    const [isPending, startTransition] = useTransition()

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editEntry, setEditEntry] = useState<TimesheetEntry | null>(null)

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<TimesheetEntry | null>(null)
    const [isDeleting, startDeleteTransition] = useTransition()

    // ── Verify ────────────────────────────────────────────────────────────────
    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked
            ? new Set(initialTimesheets.filter(t => t.clock_out && t.status === "pending").map(t => t.id))
            : new Set()
        )
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        const next = new Set(selectedIds)
        checked ? next.add(id) : next.delete(id)
        setSelectedIds(next)
    }

    const handleVerifySelected = () => {
        if (selectedIds.size === 0) return
        startTransition(async () => {
            const result = await verifyTimesheets(Array.from(selectedIds))
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Verified ${selectedIds.size} timesheet${selectedIds.size === 1 ? "" : "s"}`)
                setSelectedIds(new Set())
                router.refresh()
            }
        })
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    const confirmDelete = () => {
        if (!deleteTarget) return
        startDeleteTransition(async () => {
            const result = await adminDeleteTimesheet(deleteTarget.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Entry deleted")
                setDeleteTarget(null)
                router.refresh()
            }
        })
    }

    // ── Open dialogs ──────────────────────────────────────────────────────────
    const openAdd = () => {
        setEditEntry(null)
        setDialogOpen(true)
    }

    const openEdit = (entry: TimesheetEntry) => {
        setEditEntry(entry)
        setDialogOpen(true)
    }

    const pendingCount = initialTimesheets.filter(t => t.clock_out && t.status === "pending").length
    const allPendingSelected = pendingCount > 0 && selectedIds.size === pendingCount

    // ── Format helpers ────────────────────────────────────────────────────────
    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-US", {
            timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric",
        })
    const fmtTime = (iso: string) =>
        new Date(iso).toLocaleTimeString("en-US", {
            timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit",
        })

    return (
        <div className="space-y-3">
            {/* Month navigator */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigateMonth(-1)}
                        data-testid="prev-month"
                        title="Previous month"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="min-w-[180px] text-center">
                        <p className="font-semibold text-slate-900">{formatMonthLabel(selectedMonth)}</p>
                        {isCurrentMonth && (
                            <p className="text-xs text-emerald-600 font-medium">Current Month</p>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigateMonth(1)}
                        disabled={isFutureMonth}
                        data-testid="next-month"
                        title="Next month"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    {!isCurrentMonth && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-700 text-xs"
                            onClick={() => {
                                const params = new URLSearchParams(searchParams.toString())
                                params.delete("month")
                                router.push(`${pathname}?${params.toString()}`)
                            }}
                        >
                            Today
                        </Button>
                    )}
                </div>
            </div>

            {/* Tenant filter + actions row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <TenantFilter tenants={tenants} selectedTenantId={selectedTenantId} />

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                        {selectedIds.size} selected for verification
                    </div>
                    <Button
                        onClick={handleVerifySelected}
                        disabled={selectedIds.size === 0 || isPending}
                        className="bg-teal-600 hover:bg-teal-700 shadow-sm"
                        data-testid="verify-selected"
                    >
                        {isPending
                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Verify Selected
                    </Button>
                    <Button
                        onClick={openAdd}
                        variant="outline"
                        className="border-slate-300 gap-2"
                        data-testid="add-entry"
                    >
                        <Plus className="w-4 h-4" />
                        Add Entry
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-white overflow-x-auto shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-100 border-b border-slate-300">
                        <TableRow className="border-slate-300 hover:bg-transparent">
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={allPendingSelected}
                                    onCheckedChange={handleSelectAll}
                                    disabled={pendingCount === 0 || isPending}
                                />
                            </TableHead>
                            <TableHead className="text-slate-900 font-bold">Tenant</TableHead>
                            <TableHead className="text-slate-900 font-bold">Date</TableHead>
                            <TableHead className="text-slate-900 font-bold">Time Range</TableHead>
                            <TableHead className="text-slate-900 font-bold">Kitchen</TableHead>
                            <TableHead className="text-slate-900 font-bold">Duration</TableHead>
                            <TableHead className="text-slate-900 font-bold">Status</TableHead>
                            <TableHead className="text-slate-900 font-bold w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialTimesheets.length > 0 ? (
                            initialTimesheets.map((shift) => {
                                const isPendingStatus = shift.clock_out && shift.status === "pending"
                                return (
                                    <TableRow key={shift.id} className="border-b border-slate-200 group">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(shift.id)}
                                                onCheckedChange={c => handleSelectOne(shift.id, !!c)}
                                                disabled={!isPendingStatus || isPending}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">
                                                {shift.profiles?.company_name ?? "Unknown"}
                                            </div>
                                            <div className="text-xs text-slate-500">{shift.profiles?.email}</div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            {fmtDate(shift.clock_in)}
                                        </TableCell>
                                        <TableCell className="text-slate-700">
                                            <span>
                                                {fmtTime(shift.clock_in)} –{" "}
                                                {shift.clock_out ? fmtTime(shift.clock_out) : "Active"}
                                            </span>
                                            {shift.is_edited && (
                                                <Badge variant="outline" className="ml-2 text-[10px] h-5 px-1.5 border-amber-200 text-amber-700 bg-amber-50">
                                                    Edited
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-900">
                                            {shift.kitchens?.name ?? "—"}
                                        </TableCell>
                                        <TableCell className="text-slate-700 tabular-nums">
                                            {shift.duration_minutes != null
                                                ? `${Math.floor(shift.duration_minutes / 60)}h ${shift.duration_minutes % 60}m`
                                                : "Active"}
                                        </TableCell>
                                        <TableCell>
                                            {!shift.clock_out ? (
                                                <Badge variant="default">Active</Badge>
                                            ) : shift.status === "pending" ? (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Verified</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                    onClick={() => openEdit(shift)}
                                                    disabled={isPending || isDeleting}
                                                    data-testid={`edit-${shift.id}`}
                                                    title="Edit entry"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => setDeleteTarget(shift)}
                                                    disabled={isPending || isDeleting}
                                                    data-testid={`delete-${shift.id}`}
                                                    title="Delete entry"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                                    No timesheets found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit / Add dialog */}
            <TimesheetEditDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                entry={editEntry}
                tenants={tenants}
                kitchens={kitchens}
                onSuccess={() => router.refresh()}
            />

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete timesheet entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the entry for{" "}
                            <strong>{deleteTarget?.profiles?.company_name ?? "this tenant"}</strong> on{" "}
                            {deleteTarget?.clock_in && fmtDate(deleteTarget.clock_in)}.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            data-testid="confirm-delete"
                        >
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
