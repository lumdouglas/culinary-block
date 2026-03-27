"use client"

import { useEffect, useMemo, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Clock } from "lucide-react"
import { adminUpsertTimesheet } from "@/app/actions/timesheets"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Kitchen { id: string; name: string }
export interface Tenant  { id: string; company_name: string; email: string | null }

export interface TimesheetEntry {
    id: string
    user_id: string
    clock_in: string       // UTC ISO
    clock_out: string | null
    duration_minutes: number | null
    status?: string | null
    kitchen_id?: string | null
    notes?: string | null
    is_edited?: boolean
    profiles?: { id: string; company_name: string; email: string | null } | null
    kitchens?: { name: string } | null
}

// ─── PST helpers ─────────────────────────────────────────────────────────────

/** UTC ISO → "YYYY-MM-DD" in PST */
function utcToDatePst(utcIso: string): string {
    const d = new Date(utcIso)
    const pstStr = d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })
    return pstStr // en-CA gives YYYY-MM-DD
}

/** UTC ISO → "HH:MM" in PST */
function utcToTimePst(utcIso: string): string {
    const d = new Date(utcIso)
    return d.toLocaleTimeString("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    })
}

/** "YYYY-MM-DD" + "HH:MM" PST → UTC ISO string */
function pstToUtc(date: string, time: string): string {
    // Build a rough UTC date by treating the value as UTC, then correct for LA offset
    const roughUtc = new Date(`${date}T${time}:00Z`)
    const laTimeStr = roughUtc.toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        hour12: false,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
    })
    // laTimeStr gives us back the LA representation of roughUtc
    // We want the UTC time that corresponds to `date` + `time` *in LA*
    // Compute offset: delta = roughUtc - LA(roughUtc)
    const [datePart, timePart] = laTimeStr.split(", ")
    const [mo, dy, yr] = datePart.split("/")
    let [hr, mn] = timePart.split(":")
    if (hr === "24") hr = "00"
    const laRepresented = new Date(`${yr}-${mo}-${dy}T${hr}:${mn}:00Z`)
    const offsetMs = roughUtc.getTime() - laRepresented.getTime()
    return new Date(roughUtc.getTime() + offsetMs).toISOString()
}

// ─── Zod form schema ──────────────────────────────────────────────────────────

const formSchema = z.object({
    tenantId:     z.string().uuid("Select a tenant"),
    date:         z.string().min(1, "Date is required"),
    clockInTime:  z.string().min(1, "Clock-in time is required"),
    clockOutDate: z.string().optional(),
    clockOutTime: z.string().optional(),
    kitchenId:    z.string().optional(),
    notes:        z.string().optional(),
}).superRefine((data, ctx) => {
    // Clock-in must not be in the future
    if (data.date && data.clockInTime) {
        try {
            const inUtc = pstToUtc(data.date, data.clockInTime)
            if (new Date(inUtc) > new Date()) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Clock-in time cannot be in the future", path: ["clockInTime"] })
            }
        } catch { /* ignore parse errors */ }
    }
    // Clock-out must be after clock-in (only when both are provided)
    if (data.date && data.clockInTime && data.clockOutDate && data.clockOutTime) {
        try {
            const inUtc  = pstToUtc(data.date, data.clockInTime)
            const outUtc = pstToUtc(data.clockOutDate, data.clockOutTime)
            if (new Date(outUtc) <= new Date(inUtc)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Clock-out must be after clock-in", path: ["clockOutTime"] })
            }
        } catch { /* ignore parse errors */ }
    }
    // If clock-out date is set, clock-out time must also be set (and vice versa)
    if (data.clockOutDate && !data.clockOutTime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a clock-out time", path: ["clockOutTime"] })
    }
    if (data.clockOutTime && !data.clockOutDate) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a clock-out date", path: ["clockOutDate"] })
    }
})

type TimesheetDialogValues = z.infer<typeof formSchema>

// ─── Component ────────────────────────────────────────────────────────────────

interface TimesheetEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    entry?: TimesheetEntry | null   // null / undefined = ADD mode
    tenants: Tenant[]
    kitchens: Kitchen[]
    onSuccess: () => void
}

export function TimesheetEditDialog({
    open, onOpenChange, entry, tenants, kitchens, onSuccess,
}: TimesheetEditDialogProps) {
    const isEdit = Boolean(entry)
    const [isPending, startTransition] = useTransition()

    const defaultValues = useMemo<TimesheetDialogValues>(() => {
        if (entry) {
            const outDate = entry.clock_out ? utcToDatePst(entry.clock_out) : utcToDatePst(entry.clock_in)
            return {
                tenantId:     entry.user_id,
                date:         utcToDatePst(entry.clock_in),
                clockInTime:  utcToTimePst(entry.clock_in),
                clockOutDate: entry.clock_out ? outDate : "",
                clockOutTime: entry.clock_out ? utcToTimePst(entry.clock_out) : "",
                kitchenId:    entry.kitchen_id ?? "",
                notes:        entry.notes ?? "",
            }
        }
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })
        return {
            tenantId: "", date: today, clockInTime: "",
            clockOutDate: today, clockOutTime: "", kitchenId: "", notes: "",
        }
    }, [entry])

    const form = useForm<TimesheetDialogValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    })

    // Reset form when dialog opens with new entry
    useEffect(() => {
        if (open) form.reset(defaultValues)
    }, [open, defaultValues]) // eslint-disable-line react-hooks/exhaustive-deps

    // Live duration preview
    const [date, clockInTime, clockOutDate, clockOutTime] = form.watch([
        "date", "clockInTime", "clockOutDate", "clockOutTime",
    ])
    const durationPreview = useMemo(() => {
        if (!date || !clockInTime || !clockOutDate || !clockOutTime) return null
        try {
            const inUtc  = pstToUtc(date, clockInTime)
            const outUtc = pstToUtc(clockOutDate, clockOutTime)
            const diffMs = new Date(outUtc).getTime() - new Date(inUtc).getTime()
            if (diffMs <= 0) return null
            const totalMin = Math.round(diffMs / 60000)
            return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`
        } catch { return null }
    }, [date, clockInTime, clockOutDate, clockOutTime])

    const onSubmit = (values: TimesheetDialogValues) => {
        startTransition(async () => {
            const clockInUtc = pstToUtc(values.date, values.clockInTime)
            const clockOutUtc = (values.clockOutDate && values.clockOutTime)
                ? pstToUtc(values.clockOutDate, values.clockOutTime)
                : null

            const kitchenId = (values.kitchenId && values.kitchenId !== "none")
                ? values.kitchenId
                : undefined

            const result = await adminUpsertTimesheet({
                id:        entry?.id,
                userId:    values.tenantId,
                clockIn:   clockInUtc,
                clockOut:  clockOutUtc ?? undefined,
                kitchenId,
                notes:     values.notes || undefined,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(isEdit ? "Timesheet updated" : "Timesheet entry added")
                onOpenChange(false)
                onSuccess()
            }
        })
    }

    const tenant = entry?.profiles ?? null
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Timesheet Entry" : "Add Timesheet Entry"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? `Editing entry for ${tenant?.company_name ?? "tenant"}. Times are in PST.`
                            : "Create a manual timesheet entry. Times are in PST."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* Tenant — select in add mode, read-only in edit mode */}
                        {isEdit ? (
                            <div>
                                <p className="text-sm font-medium text-slate-700 mb-1">Tenant</p>
                                <p className="text-sm text-slate-900 bg-slate-50 border rounded-md px-3 py-2">
                                    {tenant?.company_name ?? "—"}
                                </p>
                            </div>
                        ) : (
                            <FormField control={form.control} name="tenantId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tenant *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger data-testid="tenant-select">
                                                <SelectValue placeholder="Select a tenant…" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {tenants.map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.company_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        {/* Clock-in */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date *</FormLabel>
                                    <FormControl>
                                        <Input type="date" max={today} data-testid="clock-in-date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="clockInTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Clock-in Time (PST) *</FormLabel>
                                    <FormControl>
                                        <Input type="time" data-testid="clock-in-time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Clock-out */}
                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="clockOutDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Clock-out Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" max={today} data-testid="clock-out-date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="clockOutTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Clock-out Time (PST)</FormLabel>
                                    <FormControl>
                                        <Input type="time" data-testid="clock-out-time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Duration preview OR conflict error */}
                        {durationPreview ? (
                            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>Duration: <strong>{durationPreview}</strong></span>
                            </div>
                        ) : clockOutDate && clockOutTime && date && clockInTime ? (
                            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>Clock-out must be <strong>after</strong> clock-in.</span>
                            </div>
                        ) : null}

                        {/* Kitchen */}
                        <FormField control={form.control} name="kitchenId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Kitchen</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                    <FormControl>
                                        <SelectTrigger data-testid="kitchen-select">
                                            <SelectValue placeholder="No kitchen assigned" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">No kitchen</SelectItem>
                                        {kitchens.map(k => (
                                            <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* Notes */}
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Optional note about this entry…"
                                        className="min-h-[60px] resize-none"
                                        data-testid="notes-input"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending}
                                data-testid="submit-timesheet"
                            >
                                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {isEdit ? "Save Changes" : "Add Entry"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
