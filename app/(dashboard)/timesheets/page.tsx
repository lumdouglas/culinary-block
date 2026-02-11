
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { TimesheetRequestDialog } from "@/components/timesheets/request-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function TimesheetsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Fetch recent timesheets
    const { data: timesheets } = await supabase
        .from("timesheets")
        .select("*")
        .eq("user_id", user.id)
        .order("clock_in", { ascending: false })
        .limit(10)

    // Fetch pending requests
    const { data: requests } = await supabase
        .from("timesheet_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Timesheets</h2>
                <div className="flex items-center space-x-2">
                    <TimesheetRequestDialog />
                </div>
            </div>

            <Tabs defaultValue="shifts" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="shifts">Recent Shifts</TabsTrigger>
                    <TabsTrigger value="requests">Requests ({requests?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="shifts" className="space-y-4">
                    <div className="rounded-md border bg-white overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100 border-b border-slate-300">
                                <TableRow className="border-slate-300 hover:bg-transparent">
                                    <TableHead className="text-slate-900 font-bold">Date</TableHead>
                                    <TableHead className="text-slate-900 font-bold">Time Range</TableHead>
                                    <TableHead className="text-slate-900 font-bold">Kitchen</TableHead>
                                    <TableHead className="text-slate-900 font-bold">Duration</TableHead>
                                    <TableHead className="text-slate-900 font-bold">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timesheets?.map((shift) => (
                                    <TableRow key={shift.id} className="border-b border-slate-200">
                                        <TableCell className="font-medium text-slate-900">
                                            {new Date(shift.clock_in).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: 'short', day: 'numeric', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="text-slate-700">
                                            {new Date(shift.clock_in).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: 'numeric', minute: '2-digit' })} -
                                            {shift.clock_out ? new Date(shift.clock_out).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: 'numeric', minute: '2-digit' }) : " Now"}
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
                                ))}
                                {timesheets?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4 text-slate-500">No shifts found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                    <div className="rounded-md border bg-white">
                        <div className="p-4">
                            {requests && requests.length > 0 ? (
                                <div className="space-y-4">
                                    {requests.map((req) => (
                                        <div key={req.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold uppercase text-sm">{req.type}</span>
                                                    <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                        {req.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-500">{req.reason}</p>
                                                <p className="text-xs text-slate-500">{format(new Date(req.created_at), "MMM d, h:mm a")}</p>
                                            </div>
                                            {req.admin_notes && (
                                                <div className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded">
                                                    "{req.admin_notes}"
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-slate-500">No requests found.</div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
