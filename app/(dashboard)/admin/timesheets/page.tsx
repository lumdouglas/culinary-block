import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { AdminTimesheetsTable } from "@/components/admin/timesheets-table"

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
            id, clock_in, clock_out, duration_minutes, is_edited, status,
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
                    <p className="text-slate-500 mt-2">View and track all tenant entries and verify pending usage.</p>
                </div>
            </div>

            <AdminTimesheetsTable initialTimesheets={timesheets || []} />
        </div>
    )
}

