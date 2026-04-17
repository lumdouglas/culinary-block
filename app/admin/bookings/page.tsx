"use client"

import { useEffect, useState, useCallback } from "react"
import {
    adminGetAllBookings,
    deleteBooking,
    getStations,
    type Booking,
    type Station,
} from "@/app/actions/bookings"
import { getTenants } from "@/app/actions/admin"
import { EditBookingButton } from "@/components/bookings/edit-booking-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { CalendarDays, Search, Trash2, Loader2, RefreshCw, Clock, MapPin, User } from "lucide-react"
import {
    formatTimePST,
    formatMonthAbbrevPST,
    formatDayPST,
    formatWeekdayAbbrevPST,
} from "@/utils/timezone"
import type { Profile } from "@/types/database"

// Today in YYYY-MM-DD (local)
function todayStr() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// End of current year
function endOfYearStr() {
    return `${new Date().getFullYear()}-12-31`
}

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [stations, setStations] = useState<Station[]>([])
    const [tenants, setTenants] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // Filters
    const [search, setSearch] = useState("")
    const [stationFilter, setStationFilter] = useState("all")
    const [tenantFilter, setTenantFilter] = useState("all")
    const [fromDate, setFromDate] = useState(todayStr())
    const [toDate, setToDate] = useState(endOfYearStr())

    // Delete dialog
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null)
    const [deleting, setDeleting] = useState(false)

    const load = useCallback(async (showSpinner = true) => {
        if (showSpinner) setLoading(true)
        else setRefreshing(true)

        const [bookingsResult, stationsResult, tenantsResult] = await Promise.all([
            adminGetAllBookings({
                from: fromDate ? `${fromDate}T00:00:00` : undefined,
                to: toDate ? `${toDate}T23:59:59` : undefined,
                stationId: stationFilter !== "all" ? parseInt(stationFilter) : undefined,
                tenantId: tenantFilter !== "all" ? tenantFilter : undefined,
            }),
            getStations(),
            getTenants(),
        ])

        if (bookingsResult.error) toast.error(bookingsResult.error)
        else setBookings(bookingsResult.data ?? [])

        if (stationsResult.data) setStations(stationsResult.data)
        if (tenantsResult.data) setTenants(tenantsResult.data)

        setLoading(false)
        setRefreshing(false)
    }, [fromDate, toDate, stationFilter, tenantFilter])

    useEffect(() => { load() }, [load])

    const handleDelete = async () => {
        if (!bookingToDelete) return
        setDeleting(true)
        const result = await deleteBooking(bookingToDelete.id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Booking deleted")
            setBookings(prev => prev.filter(b => b.id !== bookingToDelete.id))
        }
        setDeleting(false)
        setBookingToDelete(null)
    }

    // Client-side text search (on top of server-side filters)
    const filtered = bookings.filter(b => {
        if (!search) return true
        const q = search.toLowerCase()
        const company = (b.profile as { company_name: string } | undefined)?.company_name ?? ""
        const stationName = (b.station as { name: string } | undefined)?.name ?? ""
        return company.toLowerCase().includes(q) || stationName.toLowerCase().includes(q) || (b.notes ?? "").toLowerCase().includes(q)
    })

    // Sort stations for display
    const sortedStations = [...stations].sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, ""), 10)
        const numB = parseInt(b.name.replace(/\D/g, ""), 10)
        return (isNaN(numA) ? 999 : numA) - (isNaN(numB) ? 999 : numB)
    })

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto py-10 px-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="bg-teal-100 p-2 rounded-lg">
                                <CalendarDays className="w-7 h-7 text-teal-700" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900">Booking Management</h1>
                        </div>
                        <p className="text-slate-500 ml-14 text-sm">
                            View, edit, or delete any confirmed reservation
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={refreshing}
                        onClick={() => load(false)}
                        className="self-start gap-1.5"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6 bg-white border-slate-200 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Text search */}
                        <div className="relative sm:col-span-2 lg:col-span-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <Input
                                placeholder="Search tenant or notes…"
                                className="pl-9"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Station filter */}
                        <Select value={stationFilter} onValueChange={setStationFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All stations" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stations</SelectItem>
                                {sortedStations.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Tenant filter */}
                        <Select value={tenantFilter} onValueChange={setTenantFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All tenants" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tenants</SelectItem>
                                {tenants
                                    .filter(t => t.company_name && t.company_name !== "New User")
                                    .sort((a, b) => a.company_name.localeCompare(b.company_name))
                                    .map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.company_name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>

                        {/* Date range */}
                        <div className="flex gap-2 items-center col-span-1 sm:col-span-2 lg:col-span-1">
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                                className="text-sm"
                            />
                            <span className="text-slate-400 text-sm shrink-0">→</span>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                                className="text-sm"
                            />
                        </div>
                    </div>
                </Card>

                {/* Stats row */}
                <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">{filtered.length}</span>
                    <span>booking{filtered.length !== 1 ? "s" : ""} shown</span>
                    {filtered.length !== bookings.length && (
                        <span className="text-slate-400">(of {bookings.length} total)</span>
                    )}
                </div>

                {/* Booking list */}
                {loading ? (
                    <div className="flex items-center justify-center py-24 text-slate-400 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Loading bookings…
                    </div>
                ) : filtered.length === 0 ? (
                    <Card className="p-12 text-center text-slate-500 bg-white">
                        <CalendarDays className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium">No bookings found</p>
                        <p className="text-sm mt-1 text-slate-400">Try adjusting the filters above.</p>
                    </Card>
                ) : (
                    <div className="space-y-2.5">
                        {filtered.map(booking => {
                            const station = booking.station as { id: number; name: string; category: string } | undefined
                            const company = (booking.profile as { company_name: string } | undefined)?.company_name ?? "Unknown"

                            return (
                                <Card
                                    key={booking.id}
                                    className="bg-white border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow"
                                >
                                    {/* Date badge */}
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                                        <span className="text-[10px] font-semibold uppercase tracking-wide leading-none">
                                            {formatMonthAbbrevPST(booking.start_time)}
                                        </span>
                                        <span className="text-xl font-bold leading-tight">
                                            {formatDayPST(booking.start_time)}
                                        </span>
                                        <span className="text-[10px] font-medium leading-none">
                                            {formatWeekdayAbbrevPST(booking.start_time)}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        {/* Tenant */}
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <p className="font-semibold text-slate-900 truncate">{company}</p>
                                        </div>

                                        {/* Time + Station */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            <span className="flex items-center gap-1 text-sm text-slate-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatTimePST(booking.start_time)} – {formatTimePST(booking.end_time)}
                                            </span>
                                            {station && (
                                                <span className="flex items-center gap-1 text-sm text-slate-500">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {station.name}
                                                    <Badge variant="outline" className="ml-1 text-xs py-0 px-1.5 font-normal border-slate-200 text-slate-400">
                                                        {station.category}
                                                    </Badge>
                                                </span>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        {booking.notes && (
                                            <p className="text-xs text-slate-400 mt-1 truncate">{booking.notes}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                        <EditBookingButton
                                            bookingId={booking.id}
                                            currentStationId={station?.id ?? 0}
                                            currentStartTime={booking.start_time}
                                            currentEndTime={booking.end_time}
                                            currentNotes={booking.notes ?? ""}
                                            stations={sortedStations}
                                            isAdmin={true}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 gap-1.5"
                                            onClick={() => setBookingToDelete(booking)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={!!bookingToDelete} onOpenChange={open => !open && setBookingToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {bookingToDelete && (() => {
                                const company = (bookingToDelete.profile as { company_name: string } | undefined)?.company_name ?? "Unknown"
                                const station = (bookingToDelete.station as { name: string } | undefined)?.name ?? "Unknown"
                                return (
                                    <>
                                        This will <strong>permanently remove</strong> the booking for{" "}
                                        <strong>{company}</strong> at <strong>{station}</strong> on{" "}
                                        <strong>
                                            {formatWeekdayAbbrevPST(bookingToDelete.start_time)}{" "}
                                            {formatMonthAbbrevPST(bookingToDelete.start_time)}{" "}
                                            {formatDayPST(bookingToDelete.start_time)}
                                        </strong>{" "}
                                        ({formatTimePST(bookingToDelete.start_time)} – {formatTimePST(bookingToDelete.end_time)}).
                                        <br /><br />
                                        This action cannot be undone.
                                    </>
                                )
                            })()}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white gap-2"
                        >
                            {deleting ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : "Yes, Delete It"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
