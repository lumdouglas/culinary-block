
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { RequestActionDialog } from "@/components/timesheets/admin-actions"
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

    // Fetch pending requests
    const { data: requests, error } = await supabase
        .from("timesheet_requests")
        .select(`
        *,
        profiles:user_id (company_name, email)
    `)
        .eq("status", "pending")
        .order("created_at", { ascending: true })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Timesheet Requests</h2>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tenant</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Requested Time</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests && requests.length > 0 ? (
                            requests.map((req: any) => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.profiles?.company_name}</div>
                                        <div className="text-xs text-slate-500">{req.profiles?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="uppercase">{req.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {req.clock_in && (
                                                <div>In: {format(new Date(req.clock_in), "MM/dd h:mm a")}</div>
                                            )}
                                            {req.clock_out && (
                                                <div>Out: {format(new Date(req.clock_out), "MM/dd h:mm a")}</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px]">
                                        <p className="text-sm text-slate-600 truncate" title={req.reason}>{req.reason}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <RequestActionDialog requestId={req.id} status="approved" />
                                            <RequestActionDialog requestId={req.id} status="rejected" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                    No pending requests.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
