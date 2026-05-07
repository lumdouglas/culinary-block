import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditTimesheetDialog } from "@/components/timesheets/edit-dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Clock, CalendarDays } from "lucide-react"
import { startOfMonth, endOfMonth, addMonths, subMonths, format, isSameMonth, parseISO } from "date-fns"

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

    const { month } = await searchParams

    // Determine current month view
    const currentDate = new Date()
    const viewDate = month ? new Date(`${month}-01T00:00:00`) : currentDate

    // Date navigation logic
    const startDate = startOfMonth(viewDate)
    const endDate = endOfMonth(viewDate)
    const prevMonthStr = format(subMonths(viewDate, 1), 'yyyy-MM')
    const nextMonthStr = format(addMonths(viewDate, 1), 'yyyy-MM')
    const isCurrentMonth = isSameMonth(viewDate, currentDate)
    const currentMonthStr = format(currentDate, 'yyyy-MM')

    // Fetch timesheets for the viewed month
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

    // Fetch lightweight all-time data to build monthly history
    const { data: allTimesheets } = await supabase
        .from("timesheets")
        .select("clock_in, duration_minutes")
        .eq("user_id", user.id)
        .not("clock_in", "is", null)
        .order("clock_in", { ascending: false })

    // Build monthly summary map
    const monthSummaryMap: Record<string, { totalMinutes: number; shiftCount: number; date: Date }> = {}
    for (const record of allTimesheets || []) {
        const pstStr = new Date(record.clock_in).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })
        const pstDate = new Date(pstStr)
        const key = format(pstDate, 'yyyy-MM')
        if (!monthSummaryMap[key]) {
            monthSummaryMap[key] = { totalMinutes: 0, shiftCount: 0, date: pstDate }
        }
        monthSummaryMap[key].totalMinutes += record.duration_minutes || 0
        monthSummaryMap[key].shiftCount++
    }
    const monthHistory = Object.entries(monthSummaryMap)
        .sort(([a], [b]) => b.localeCompare(a))

    // Calculate total hours for the viewed month
    const totalMinutes = timesheets?.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0) || 0
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60
    const viewMonthStr = format(viewDate, 'yyyy-MM')

    return (
        <div className="flex-1 p-8 pt-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Timesheet</h2>
                    <p className="text-slate-500 mt-1">
                        Viewing activity for {format(viewDate, 'MMMM yyyy')}
                    </p>
                </div>

                {/* Month navigation */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <Link href={`?month=${prevMonthStr}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>

                    <div className="text-sm font-medium px-3 text-center min-w-[140px]">
                        <div className="text-slate-400 text-xs uppercase tracking-wide leading-tight">Total</div>
                        <div className="text-slate-900 font-bold">{totalHours}h {remainingMinutes}m</div>
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

            {/* Main shifts table */}
            <div className="rounded-xl border bg-white overflow-x-auto shadow-sm mb-8">
                <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                        <TableRow className="border-slate-200 hover:bg-transparent">
                            <TableHead className="text-slate-700 font-semibold">Date</TableHead>
                            <TableHead className="text-slate-700 font-semibold">Time Range</TableHead>
                            <TableHead className="text-slate-700 font-semibold">Kitchen</TableHead>
                            <TableHead className="text-slate-700 font-semibold">Duration</TableHead>
                            <TableHead className="text-slate-700 font-semibold">Status</TableHead>
                            <TableHead className="text-slate-700 font-semibold w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {timesheets?.map((shift: any) => (
                            <TableRow key={shift.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <TableCell className="font-medium text-slate-900">
                                    {new Date(shift.clock_in).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: 'short', day: 'numeric', year: 'numeric' })}
                                </TableCell>
                                <TableCell className="text-slate-700">
                                    {new Date(shift.clock_in).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: 'numeric', minute: '2-digit' })} –
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
                                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                    No shifts found for {format(viewDate, 'MMMM yyyy')}.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Monthly History Panel */}
            {monthHistory.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <CalendarDays className="h-5 w-5 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-800">Monthly History</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {monthHistory.map(([key, summary]) => {
                            const isActive = key === viewMonthStr
                            const isCurrent = key === currentMonthStr
                            const hrs = Math.floor(summary.totalMinutes / 60)
                            const mins = summary.totalMinutes % 60
                            const label = summary.date.toLocaleDateString('en-US', {
                                timeZone: 'America/Los_Angeles',
                                month: 'short',
                                year: 'numeric',
                            })
                            return (
                                <Link key={key} href={`?month=${key}`}>
                                    <div className={`
                                        rounded-xl border p-3 text-center cursor-pointer transition-all duration-150
                                        hover:shadow-md hover:-translate-y-0.5
                                        ${isActive
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                                        }
                                    `}>
                                        <div className={`text-xs font-medium mb-1 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {label}
                                            {isCurrent && (
                                                <span className={`ml-1 text-[10px] font-semibold ${isActive ? 'text-emerald-300' : 'text-emerald-600'}`}>
                                                    ● Current
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-base font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                                            {hrs}h {mins}m
                                        </div>
                                        <div className={`text-[11px] mt-1 ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                                            {summary.shiftCount} shift{summary.shiftCount !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
