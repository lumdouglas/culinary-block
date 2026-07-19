"use client"

import { Badge } from "@/components/ui/badge"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { RequestActionDialog } from "@/components/timesheets/admin-actions"
import { AlertCircle } from "lucide-react"

export interface TimesheetRequestRow {
    id: string
    type: "create" | "update" | "delete"
    reason: string | null
    clock_in: string | null
    clock_out: string | null
    created_at: string
    profiles: { company_name: string; email: string | null } | null
}

const TYPE_LABELS: Record<TimesheetRequestRow["type"], string> = {
    create: "Missing Shift",
    update: "Fix Shift",
    delete: "Remove Shift",
}

function formatPst(value: string | null) {
    if (!value) return "—"
    return new Date(value).toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    })
}

export function TimesheetRequestsPanel({ requests }: { requests: TimesheetRequestRow[] }) {
    if (requests.length === 0) return null

    return (
        <div className="rounded-xl border bg-amber-50/50 border-amber-200 overflow-x-auto shadow-sm mb-6">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <h3 className="text-sm font-semibold text-amber-900">
                    Pending Timesheet Requests ({requests.length})
                </h3>
            </div>
            <Table>
                <TableHeader className="border-b border-amber-200">
                    <TableRow className="border-amber-200 hover:bg-transparent">
                        <TableHead className="text-slate-700 font-semibold">Tenant</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Type</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Requested Time</TableHead>
                        <TableHead className="text-slate-700 font-semibold">Reason</TableHead>
                        <TableHead className="text-slate-700 font-semibold w-[220px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((req) => (
                        <TableRow key={req.id} className="border-b border-amber-100">
                            <TableCell className="font-medium text-slate-900">
                                {req.profiles?.company_name ?? "Unknown"}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{TYPE_LABELS[req.type]}</Badge>
                            </TableCell>
                            <TableCell className="text-slate-700">
                                {formatPst(req.clock_in)}
                                {req.clock_out ? ` – ${formatPst(req.clock_out)}` : ""}
                            </TableCell>
                            <TableCell className="text-slate-700 max-w-[240px] truncate" title={req.reason ?? ""}>
                                {req.reason ?? "—"}
                            </TableCell>
                            <TableCell className="flex items-center gap-2">
                                <RequestActionDialog requestId={req.id} status="approved" />
                                <RequestActionDialog requestId={req.id} status="rejected" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
