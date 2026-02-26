"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Edit2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { updateTimesheet } from "@/app/actions/kiosk"

const formSchema = z.object({
    clockIn: z.string().min(1, "Clock In is required"),
    clockOut: z.string().optional()
})

interface EditTimesheetDialogProps {
    shiftId: string
    currentClockIn: string
    currentClockOut?: string | null
    isEdited?: boolean
}

export function EditTimesheetDialog({ shiftId, currentClockIn, currentClockOut, isEdited }: EditTimesheetDialogProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const toLocalISO = (dateStr: string) => {
        const d = new Date(dateStr)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        return d.toISOString().slice(0, 16)
    }

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clockIn: toLocalISO(currentClockIn),
            clockOut: currentClockOut ? toLocalISO(currentClockOut) : "",
        },
    })

    // Reset form when dialog opens so it doesn't keep stale unsaved edits
    // Reset form when dialog opens so it doesn't keep stale unsaved edits
    useEffect(() => {
        if (open) {
            form.reset({
                clockIn: toLocalISO(currentClockIn),
                clockOut: currentClockOut ? toLocalISO(currentClockOut) : "",
            })
        }
    }, [open, currentClockIn, currentClockOut, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const res = await updateTimesheet(
                shiftId,
                new Date(values.clockIn).toISOString(),
                values.clockOut ? new Date(values.clockOut).toISOString() : null
            )

            if (res?.error) {
                throw new Error(res.error)
            }

            toast.success("Timesheet updated successfully")
            setOpen(false)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Failed to update timesheet")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 ml-2">
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Timesheet</DialogTitle>
                    <DialogDescription>
                        Adjust your clock-in or clock-out times. Your changes will be logged and marked as edited.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="clockIn"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Clock In</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="clockOut"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Clock Out</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
