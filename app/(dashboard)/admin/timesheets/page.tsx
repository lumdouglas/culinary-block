import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { AdminTimesheetsTable } from "@/components/admin/timesheets-table"
import { getTenants } from "@/app/actions/admin"

export default async function AdminTimesheetsPage({
    searchParams,
}: {
    searchParams: { tenantId?: string }
}) {
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

    const selectedTenantId = (await searchParams).tenantId

    // Fetch all tenants for the filter
    const { data: tenants } = await getTenants()

    // Fetch timesheets with optional tenant filter
    let query = supabase
        .from("timesheets")
        .select(`
            id, clock_in, clock_out, duration_minutes, is_edited, status,
            profiles:user_id (id, company_name, email),
            kitchens (name)
        `)
        .order("clock_in", { ascending: false })
        .limit(100)

    if (selectedTenantId) {
        query = query.eq("user_id", selectedTenantId)
    }

    const { data: timesheets, error } = await query

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

            <AdminTimesheetsTable 
                initialTimesheets={timesheets || []} 
                tenants={tenants || []}
                selectedTenantId={selectedTenantId}
            />
        </div>
    )
}

