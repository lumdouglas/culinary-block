import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Calendar, Clock, MapPin } from "lucide-react"
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button"
import { EditBookingButton } from "@/components/bookings/edit-booking-button"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    formatTimePST,
    formatMonthAbbrevPST,
    formatDayPST,
    formatWeekdayAbbrevPST,
    monthGroupKeyPST,
    durationLabel,
} from "@/utils/timezone"

export default async function MyBookingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const now = new Date().toISOString()

    // Fetch bookings and stations in parallel
    const [{ data: bookings, error }, { data: stationsRaw }] = await Promise.all([
        supabase
            .from("bookings")
            .select(`id, start_time, end_time, notes, status, station:stations(id, name, category)`)
            .eq("user_id", user.id)
            .eq("status", "confirmed")
            .gte("end_time", now)
            .order("start_time", { ascending: true }),
        supabase
            .from("stations")
            .select("id, name, category, equipment")
            .eq("is_active", true)
            .order("id"),
    ])

    // Sort stations 1→4
    const stations = (stationsRaw ?? []).sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, ""), 10)
        const numB = parseInt(b.name.replace(/\D/g, ""), 10)
        return (isNaN(numA) ? 999 : numA) - (isNaN(numB) ? 999 : numB)
    })

    if (error) {
        console.error("Error fetching bookings:", error)
    }

    // Group bookings by "Month Year" in PST
    const grouped: Record<string, typeof bookings> = {}
    for (const booking of bookings ?? []) {
        const key = monthGroupKeyPST(booking.start_time)
        if (!grouped[key]) grouped[key] = []
        grouped[key]!.push(booking)
    }

    const monthKeys = Object.keys(grouped)

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">My Bookings</h2>
                    <p className="text-slate-500 mt-1">Your upcoming kitchen reservations</p>
                </div>
                <Link href="/calendar">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                        <Calendar className="w-4 h-4" />
                        Book a Station
                    </Button>
                </Link>
            </div>

            {monthKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="p-4 bg-slate-100 rounded-full mb-4">
                        <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No upcoming bookings</h3>
                    <p className="text-sm text-slate-500 mb-6 max-w-xs">
                        You have no confirmed reservations. Head to the calendar to book a kitchen station.
                    </p>
                    <Link href="/calendar">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                            Go to Calendar
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {monthKeys.map((month) => (
                        <section key={month}>
                            {/* Month heading */}
                            <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-base font-semibold text-slate-800">{month}</h3>
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-xs text-slate-400 font-medium">
                                    {grouped[month]!.length} booking{grouped[month]!.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            {/* Booking cards */}
                            <div className="space-y-3">
                                {grouped[month]!.map((booking) => {
                                    const duration = durationLabel(booking.start_time, booking.end_time)
                                    const station = booking.station as unknown as { id: number; name: string; category: string } | null

                                    return (
                                        <div
                                            key={booking.id}
                                            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
                                        >
                                            {/* Date badge — formatted in PST */}
                                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-teal-50 border border-teal-100 text-teal-700">
                                                <span className="text-xs font-semibold uppercase tracking-wide leading-none">
                                                    {formatMonthAbbrevPST(booking.start_time)}
                                                </span>
                                                <span className="text-2xl font-bold leading-tight">
                                                    {formatDayPST(booking.start_time)}
                                                </span>
                                                <span className="text-xs font-medium leading-none">
                                                    {formatWeekdayAbbrevPST(booking.start_time)}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 truncate">
                                                    {station?.name ?? "Kitchen Station"}
                                                </p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                    <span className="flex items-center gap-1 text-sm text-slate-500">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatTimePST(booking.start_time)} – {formatTimePST(booking.end_time)}
                                                        <span className="text-slate-400 ml-1">({duration})</span>
                                                    </span>
                                                    {station?.category && (
                                                        <span className="flex items-center gap-1 text-sm text-slate-500">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            {station.category}
                                                        </span>
                                                    )}
                                                </div>
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
                                                    stations={stations}
                                                />
                                                <CancelBookingButton bookingId={booking.id} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    )
}
