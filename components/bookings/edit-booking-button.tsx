"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updateBooking } from "@/app/actions/bookings"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Pencil, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toDateInputPST, toTimeInputPST } from "@/utils/timezone"

const durationOptions = [
    { label: "30 minutes", value: 0.5 },
    { label: "1 hour", value: 1 },
    { label: "1.5 hours", value: 1.5 },
    { label: "2 hours", value: 2 },
    { label: "2.5 hours", value: 2.5 },
    { label: "3 hours", value: 3 },
    { label: "4 hours", value: 4 },
    { label: "5 hours", value: 5 },
    { label: "6 hours", value: 6 },
    { label: "8 hours", value: 8 },
    { label: "10 hours", value: 10 },
    { label: "12 hours", value: 12 },
]

const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2)
    const minutes = (i % 2) * 30
    const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
    const label = new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
    })
    return { value: time, label }
})

const editSchema = z.object({
    station_id: z.string().min(1, "Please select a station"),
    date: z.string().min(1, "Please select a date"),
    start_time: z.string().min(1, "Please select a start time"),
    duration: z.string().min(1, "Please select a duration"),
    notes: z.string().optional(),
})

type EditFormValues = z.infer<typeof editSchema>

interface Station {
    id: number
    name: string
    category: string
    equipment?: string
}

interface EditBookingButtonProps {
    bookingId: string
    currentStationId: number
    currentStartTime: string   // ISO string
    currentEndTime: string     // ISO string
    currentNotes?: string
    stations: Station[]
}

// todayStr and maxDateStr are module-level constants (safe — static dates)
const todayStr = toDateInputPST(new Date().toISOString())
const maxDateStr = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 6)
    return toDateInputPST(d.toISOString())
})()

function toLocalTimeStr(iso: string) {
    return toTimeInputPST(iso)
}

function calcDuration(startIso: string, endIso: string): string {
    const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime()
    const diffHrs = diffMs / (1000 * 60 * 60)
    // Find closest valid option
    const closest = durationOptions.reduce((prev, curr) =>
        Math.abs(curr.value - diffHrs) < Math.abs(prev.value - diffHrs) ? curr : prev
    )
    return closest.value.toString()
}

export function EditBookingButton({
    bookingId,
    currentStationId,
    currentStartTime,
    currentEndTime,
    currentNotes,
    stations,
}: EditBookingButtonProps) {
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const router = useRouter()

    const form = useForm<EditFormValues>({
        resolver: zodResolver(editSchema),
        defaultValues: {
            station_id: currentStationId.toString(),
            date: toDateInputPST(currentStartTime),
            start_time: toLocalTimeStr(currentStartTime),
            duration: calcDuration(currentStartTime, currentEndTime),
            notes: currentNotes ?? "",
        },
    })

    // Reset to current booking values when dialog opens
    const handleOpenChange = (next: boolean) => {
        if (next) {
            form.reset({
                station_id: currentStationId.toString(),
                date: toDateInputPST(currentStartTime),
                start_time: toLocalTimeStr(currentStartTime),
                duration: calcDuration(currentStartTime, currentEndTime),
                notes: currentNotes ?? "",
            })
        }
        setOpen(next)
    }

    const watchedValues = form.watch()
    const endTimeLabel = (() => {
        if (watchedValues.date && watchedValues.start_time && watchedValues.duration) {
            const start = new Date(`${watchedValues.date}T${watchedValues.start_time}:00`)
            const end = new Date(start.getTime() + parseFloat(watchedValues.duration) * 3600000)
            return end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
        }
        return "—"
    })()

    async function onSubmit(values: EditFormValues) {
        setSubmitting(true)
        try {
            const start = new Date(`${values.date}T${values.start_time}:00`)
            const end = new Date(start.getTime() + parseFloat(values.duration) * 3600000)

            const result = await updateBooking(
                bookingId,
                parseInt(values.station_id),
                start.toISOString(),
                end.toISOString(),
                values.notes
            )

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Booking updated!")
                setOpen(false)
                router.refresh()
            }
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-600 border-slate-200 hover:bg-slate-50 gap-1.5"
                >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl">Edit Booking</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Station */}
                        <FormField
                            control={form.control}
                            name="station_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Station</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a station" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {stations.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>
                                                    {s.name} ({s.category})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Date */}
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="date"
                                            min={todayStr}
                                            max={maxDateStr}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Start time + Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Time</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select time" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="max-h-60">
                                                {timeSlots.map((slot) => (
                                                    <SelectItem key={slot.value} value={slot.value}>
                                                        {slot.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select duration" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {durationOptions.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value.toString()}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* End time display */}
                        <div className="bg-slate-100 rounded-lg p-3 text-sm">
                            <span className="text-slate-500">End Time: </span>
                            <span className="font-medium">{endTimeLabel}</span>
                        </div>

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any special requirements or notes..."
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-2 pt-2">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" className="flex-1">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                                disabled={submitting}
                            >
                                {submitting
                                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
                                    : "Save Changes"
                                }
                            </Button>
                        </div>

                        <p className="text-xs text-slate-400 text-center pt-1">
                            Bookings are limited to 6 months in advance and one station at a time.{" "}
                            <span className="text-slate-500 font-medium">Need more? Contact Culinary Block Management.</span>
                        </p>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
