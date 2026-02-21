import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function AdminTimesheetsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect("/login")

    // Verify admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "admin") return redirect("/")

    // Fetch all timesheets across all tenants
    const { data: timesheets, error } = await supabase
        .from("timesheets")
        .select(`
            id, clock_in, clock_out, duration_minutes, is_edited,
            profiles:user_id (company_name, email),
            kitchens (name)
        `)
        .order("clock_in", { ascending: false })
        .limit(100)

    if (error) {
        console.error("Error fetching timesheets:", error)
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Global Timesheet Log</h2>
                    <p className="text-slate-500 mt-2">View and track all tenant entries and edits</p>
                </div>
            </div>

            <div className="rounded-md border bg-white overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-100 border-b border-slate-300">
                        <TableRow className="border-slate-300 hover:bg-transparent">
                            <TableHead className="text-slate-900 font-bold">Tenant</TableHead>
                            <TableHead className="text-slate-900 font-bold">Date</TableHead>
                            <TableHead className="text-slate-900 font-bold">Time Range</TableHead>
                            <TableHead className="text-slate-900 font-bold">Kitchen</TableHead>
                            <TableHead className="text-slate-900 font-bold">Duration</TableHead>
                            <TableHead className="text-slate-900 font-bold">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {timesheets && timesheets.length > 0 ? (
                            timesheets.map((shift: any) => (
                                <TableRow key={shift.id} className="border-b border-slate-200">
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
                                        {shift.duration_minutes ?
                                            `${Math.floor(shift.duration_minutes / 60)}h ${shift.duration_minutes % 60}m`
                                            : "Active"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={shift.clock_out ? "secondary" : "default"}>
                                            {shift.clock_out ? "Completed" : "Active"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
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
