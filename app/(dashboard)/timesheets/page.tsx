import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditTimesheetDialog } from "@/components/timesheets/edit-dialog"
import { startOfMonth, endOfMonth, subMonths, addMonths, format, isSameMonth, parseISO } from "date-fns"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default async function TimesheetsPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const params = await searchParams
    const now = new Date()

    // Parse ?month=YYYY-MM, default to current month
    const selectedMonth = params.month
        ? parseISO(`${params.month}-01`)
        : now

    const monthStart = startOfMonth(selectedMonth)
    const monthEnd = endOfMonth(selectedMonth)
    const prevMonthParam = format(subMonths(selectedMonth, 1), "yyyy-MM")
    const nextMonthParam = format(addMonths(selectedMonth, 1), "yyyy-MM")
    const isCurrentMonth = isSameMonth(selectedMonth, now)
    const monthLabel = format(selectedMonth, "MMMM yyyy")

    const { data: timesheets } = await supabase
        .from("timesheets")
        .select(`
            id, clock_in, clock_out, duration_minutes, is_edited,
            kitchens (name)
        `)
        .eq("user_id", user.id)
        .gte("clock_in", monthStart.toISOString())
        .lte("clock_in", monthEnd.toISOString())
        .order("clock_in", { ascending: false })

    const totalMinutes = timesheets?.reduce((sum, shift) => sum + (shift.duration_minutes || 0), 0) ?? 0
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold tracking-tight">My Timesheets</h2>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4">
                <Link href={`/timesheets?month=${prevMonthParam}`}>
                    <Button variant="outline" size="sm" data-testid="prev-month-button">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                    </Button>
                </Link>
                <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">{monthLabel}</p>
                    <p className="text-sm text-slate-500">
                        {totalMinutes > 0
                            ? `${totalHours}h ${remainingMinutes}m total`
                            : "No recorded hours"}
                    </p>
                </div>
                {isCurrentMonth ? (
                    <Button variant="outline" size="sm" disabled data-testid="next-month-button">
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                ) : (
                    <Link href={`/timesheets?month=${nextMonthParam}`}>
                        <Button variant="outline" size="sm" data-testid="next-month-button">
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </Link>
                )}
            </div>

            <div className="rounded-md border bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-100 border-b border-slate-300">
                        <TableRow className="border-slate-300 hover:bg-transparent">
                            <TableHead className="text-slate-900 font-bold">Date</TableHead>
                            <TableHead className="text-slate-900 font-bold">Time Range</TableHead>
                            <TableHead className="text-slate-900 font-bold">Kitchen</TableHead>
                            <TableHead className="text-slate-900 font-bold">Duration</TableHead>
                            <TableHead className="text-slate-900 font-bold">Status</TableHead>
                            <TableHead className="text-slate-900 font-bold w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {timesheets?.map((shift) => (
                            <TableRow key={shift.id} className="border-b border-slate-200">
                                <TableCell className="font-medium text-slate-900">
                                    {new Date(shift.clock_in).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric" })}
                                </TableCell>
                                <TableCell className="text-slate-700">
                                    {new Date(shift.clock_in).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })} -{" "}
                                    {shift.clock_out
                                        ? new Date(shift.clock_out).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })
                                        : "Now"}
                                    {shift.is_edited && (
                                        <Badge variant="outline" className="ml-2 text-[10px] h-5 px-1.5 border-amber-200 text-amber-700 bg-amber-50">
                                            Edited
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-slate-900">{shift.kitchens?.name || "—"}</TableCell>
                                <TableCell className="text-slate-700">
                                    {shift.duration_minutes
                                        ? `${Math.floor(shift.duration_minutes / 60)}h ${shift.duration_minutes % 60}m`
                                        : "Active"}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={shift.clock_out ? "secondary" : "default"}>
                                        {shift.clock_out ? "Completed" : "Active"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <EditTimesheetDialog
                                        shiftId={shift.id}
                                        currentClockIn={shift.clock_in}
                                        currentClockOut={shift.clock_out}
                                        isEdited={shift.is_edited}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!timesheets || timesheets.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-slate-500">
                                    No shifts recorded for {monthLabel}.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
