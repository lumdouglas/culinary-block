
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { TimesheetRequestDialog } from "@/components/timesheets/request-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {timesheets?.map((shift) => (
                            <Card key={shift.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500">
                                        {format(new Date(shift.clock_in), "MMM d, yyyy")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {shift.duration_minutes ?
                                            `${Math.floor(shift.duration_minutes / 60)}h ${shift.duration_minutes % 60}m`
                                            : "Active"}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {format(new Date(shift.clock_in), "h:mm a")} -
                                        {shift.clock_out ? format(new Date(shift.clock_out), "h:mm a") : " Now"}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
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
                                                <p className="text-xs text-slate-400">{format(new Date(req.created_at), "MMM d, h:mm a")}</p>
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
