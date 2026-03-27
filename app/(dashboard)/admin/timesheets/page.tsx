import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { AdminTimesheetsTable } from "@/components/admin/timesheets-table"
import { getTenants } from "@/app/actions/admin"

export const dynamic = "force-dynamic"

function getCurrentMonthKey() {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }))
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export default async function AdminTimesheetsPage({
    searchParams,
}: {
    searchParams: Promise<{ tenantId?: string; month?: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect("/login")

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

    if (profile?.role !== "admin") return redirect("/")

    const { tenantId: selectedTenantId, month: monthParam } = await searchParams
    const month = monthParam ?? getCurrentMonthKey()

    // PST-aware month boundaries → UTC for the query
    const [year, mon] = month.split("-").map(Number)
    // PST = UTC-8 standard / UTC-7 daylight. Using UTC+8 offset to get start of PST month.
    const startUtc = new Date(Date.UTC(year, mon - 1, 1, 8))   // noon UTC ≈ midnight PST
    const endUtc   = new Date(Date.UTC(year, mon,     1, 8))

    // Fetch tenants, kitchens, and timesheets in parallel
    const [{ data: tenants }, { data: kitchens }] = await Promise.all([
        getTenants(),
        supabase
            .from("kitchens")
            .select("id, name")
            .eq("is_active", true)
            .order("name"),
    ])

    let query = supabase
        .from("timesheets")
        .select(`
            id, user_id, clock_in, clock_out, duration_minutes, is_edited, status, kitchen_id, notes,
            profiles:user_id (id, company_name, email),
            kitchens (name)
        `)
        .gte("clock_in", startUtc.toISOString())
        .lt("clock_in",  endUtc.toISOString())
        .order("clock_in", { ascending: false })

    if (selectedTenantId) {
        query = query.eq("user_id", selectedTenantId)
    }

    const { data: timesheets, error } = await query

    if (error) {
        console.error("Error fetching timesheets:", error)
    }

    // Summary stats for the month
    const completed = (timesheets ?? []).filter(t => t.clock_out)
    const totalMinutes = completed.reduce((s, t) => s + (t.duration_minutes ?? 0), 0)
    const totalHours   = totalMinutes / 60
    const pendingCount = completed.filter(t => t.status === "pending").length
    const activeSessions = (timesheets ?? []).filter(t => !t.clock_out).length

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Global Timesheet Log</h2>
                <p className="text-slate-500 mt-1">View and track all tenant entries and verify pending usage.</p>
            </div>

            {/* Month summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Hours</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{totalHours.toFixed(1)}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Sessions</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{completed.length}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs text-amber-700 font-medium uppercase tracking-wide">Pending Verify</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Active Now</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{activeSessions}</p>
                </div>
            </div>

            <AdminTimesheetsTable
                initialTimesheets={(timesheets ?? []) as any}
                tenants={tenants ?? []}
                kitchens={kitchens ?? []}
                selectedTenantId={selectedTenantId}
                selectedMonth={month}
            />
        </div>
    )
}

