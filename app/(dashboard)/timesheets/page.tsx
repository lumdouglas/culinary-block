import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditTimesheetDialog } from "@/components/timesheets/edit-dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { startOfMonth, endOfMonth, addMonths, subMonths, format, isSameMonth } from "date-fns"

export default async function TimesheetsPage({
    searchParams,
}: {
    searchParams: { month?: string }
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Determine current month view
    const currentDate = new Date()
    const viewDate = searchParams.month ? new Date(`${searchParams.month}-01T00:00:00`) : currentDate

    // Date navigation logic
    const startDate = startOfMonth(viewDate)
    const endDate = endOfMonth(viewDate)
    const prevMonthStr = format(subMonths(viewDate, 1), 'yyyy-MM')
    const nextMonthStr = format(addMonths(viewDate, 1), 'yyyy-MM')
    const isCurrentMonth = isSameMonth(viewDate, currentDate)

    // Fetch timesheets for the month
    const { data: timesheets } = await supabase
        .from("timesheets")
        .select(`
            id, clock_in, clock_out, duration_minutes, is_edited, status,
            kitchens (name)
        `)
        .eq("user_id", user.id)
        .gte("clock_in", startDate.toISOString())
        .lte("clock_in", endDate.toISOString())
        .order("clock_in", { ascending: false })

    // Calculate total hours
    const totalMinutes = timesheets?.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) || 0
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Timesheets</h2>
                    <p className="text-slate-500 mt-1">
                        Viewing activity for {format(viewDate, 'MMMM yyyy')}
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <Link href={`?month=${prevMonthStr}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>

                    <div className="text-sm font-medium px-4 text-center min-w-[120px]">
                        <span className="text-slate-500 mr-2">Total:</span>
                        <span className="text-slate-900 font-bold">{totalHours}h {remainingMinutes}m</span>
                    </div>

                    {isCurrentMonth ? (
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Link href={`?month=${nextMonthStr}`}>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="rounded-md border bg-white overflow-x-auto shadow-sm">
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
                        {timesheets?.map((shift: any) => (
                            <TableRow key={shift.id} className="border-b border-slate-200">
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
                                <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                                    No shifts found for {format(viewDate, 'MMMM yyyy')}.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
