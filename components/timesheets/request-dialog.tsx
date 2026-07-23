
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, PlusCircle } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { requestMissingTimesheetEntry } from "@/app/actions/timesheets"

const formSchema = z.object({
    clockIn: z.string().min(1, "Clock-in time is required"),
    clockOut: z.string().optional(),
    reason: z.string().min(5, "Please describe what happened"),
}).refine(
    (data) => !data.clockOut || new Date(data.clockIn) < new Date(data.clockOut),
    { message: "Clock out must be after clock in", path: ["clockOut"] }
)

export function TimesheetRequestDialog() {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clockIn: "",
            clockOut: "",
            reason: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const res = await requestMissingTimesheetEntry({
                clockIn: new Date(values.clockIn).toISOString(),
                clockOut: values.clockOut ? new Date(values.clockOut).toISOString() : undefined,
                reason: values.reason,
            })

            if (res?.error) {
                throw new Error(res.error)
            }

            toast.success("Request submitted. An admin will review it shortly.")
            setOpen(false)
            form.reset()
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : "Something went wrong. Please try again."
            toast.error(message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                    <PlusCircle className="h-4 w-4" />
                    Report Missing Shift
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Report a Missing Shift</DialogTitle>
                    <DialogDescription>
                        Forgot to clock in? Let us know the times and why — an admin will review and add it to your timesheet.
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

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="I forgot to clock in when my shift started..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
