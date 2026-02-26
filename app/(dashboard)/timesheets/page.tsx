import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditTimesheetDialog } from "@/components/timesheets/edit-dialog"

export default async function TimesheetsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Fetch recent timesheets
    const { data: timesheets } = await supabase
        .from("timesheets")
        .select(`
            id, clock_in, clock_out, duration_minutes, is_edited,
            kitchens (name)
        `)
        .eq("user_id", user.id)
        .order("clock_in", { ascending: false })
        .limit(20)

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Timesheets</h2>
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
                                <TableCell colSpan={6} className="text-center py-6 text-slate-500">No shifts found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
