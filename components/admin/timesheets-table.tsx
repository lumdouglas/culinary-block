"use client"

import { useState, useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { verifyTimesheets } from "@/app/actions/timesheets"
import { toast } from "sonner"
import { CheckCircle2, Loader2 } from "lucide-react"

interface TimesheetsTableProps {
    initialTimesheets: any[]
}

export function AdminTimesheetsTable({ initialTimesheets }: TimesheetsTableProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isPending, startTransition] = useTransition()

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Only select pending ones that are completed (have a clock_out)
            const selectableIds = initialTimesheets
                .filter(t => t.clock_out && t.status === 'pending')
                .map(t => t.id)
            setSelectedIds(new Set(selectableIds))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds)
        if (checked) {
            newSet.add(id)
        } else {
            newSet.delete(id)
        }
        setSelectedIds(newSet)
    }

    const handleVerifySelected = () => {
        if (selectedIds.size === 0) return

        startTransition(async () => {
            const result = await verifyTimesheets(Array.from(selectedIds))
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Successfully verified ${selectedIds.size} timesheet${selectedIds.size === 1 ? '' : 's'}`)
                setSelectedIds(new Set())
            }
        })
    }

    const pendingCount = initialTimesheets.filter(t => t.clock_out && t.status === 'pending').length
    const allPendingSelected = pendingCount > 0 && selectedIds.size === pendingCount

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-slate-500">
                    {selectedIds.size} selected
                </div>
                <Button
                    onClick={handleVerifySelected}
                    disabled={selectedIds.size === 0 || isPending}
                    className="bg-teal-600 hover:bg-teal-700"
                >
                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Verify Selected
                </Button>
            </div>

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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialTimesheets && initialTimesheets.length > 0 ? (
                            initialTimesheets.map((shift: any) => {
                                const isPendingStatus = shift.clock_out && shift.status === 'pending';

                                return (
                                    <TableRow key={shift.id} className="border-b border-slate-200">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(shift.id)}
                                                onCheckedChange={(checked) => handleSelectOne(shift.id, !!checked)}
                                                disabled={!isPendingStatus || isPending}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{shift.profiles?.company_name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-600">{shift.profiles?.email}</div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            {new Date(shift.clock_in).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: 'short', day: 'numeric', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-slate-700">
                                            {new Date(shift.clock_in).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: 'numeric', minute: '2-digit' })} -
                                            {shift.clock_out ? new Date(shift.clock_out).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: 'numeric', minute: '2-digit' }) : " Now"}
                                            {shift.is_edited && (
                                                <Badge variant="outline" className="ml-2 text-[10px] h-5 px-1.5 border-amber-200 text-amber-700 bg-amber-50">
                                                    Edited
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-900">{shift.kitchens?.name || '—'}</TableCell>
                                        <TableCell className="text-slate-700">
                                            {shift.duration_minutes != null ?
                                                `${Math.floor(shift.duration_minutes / 60)}h ${shift.duration_minutes % 60}m`
                                                : "Active"}
                                        </TableCell>
                                        <TableCell>
                                            {!shift.clock_out ? (
                                                <Badge variant="default">Active</Badge>
                                            ) : shift.status === 'pending' ? (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Verified</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                    No timesheets found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
