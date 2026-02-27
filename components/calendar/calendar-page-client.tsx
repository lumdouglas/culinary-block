"use client"

import { useState, useEffect } from 'react'
import { getStations, getBookingsForDateRange, Station, Booking } from '@/app/actions/bookings'
import { BookingCalendar } from '@/components/calendar/calendar-view'
import { BookingForm } from '@/components/calendar/booking-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, CalendarDays, User } from 'lucide-react'
import { toast } from 'sonner'

// Station color mapping for legend
const stationColors: Record<string, string> = {
    'Station 1': 'bg-teal-600',
    'Station 3': 'bg-teal-500',
    'Station 2': 'bg-blue-600',
    'Station 4': 'bg-blue-500',
    'Oven L': 'bg-green-600',
    'Oven M': 'bg-green-500',
    'Oven R': 'bg-green-400',
    'Prep Kitchen': 'bg-amber-500',
    'Dairy Clean Room': 'bg-red-400',
}

type ViewMode = 'schedule' | 'my-bookings'

export default function CalendarPageClient() {
    const [stations, setStations] = useState<Station[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [selectedStations, setSelectedStations] = useState<number[]>([])
    const [expandedStationIds, setExpandedStationIds] = useState<number[]>([])
    const [viewMode, setViewMode] = useState<ViewMode>('schedule')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined)
    const [preselectedStartTime, setPreselectedStartTime] = useState<string | undefined>(undefined)
    const [preselectedDuration, setPreselectedDuration] = useState<string | undefined>(undefined)

    // Get date range for current week
    const getWeekRange = () => {
        const now = new Date()
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 14) // Get 2 weeks of data

        return {
            start: startOfWeek.toISOString(),
            end: endOfWeek.toISOString()
        }
    }

    const loadData = async (startIso?: string, endIso?: string, showSpinner = true) => {
        if (showSpinner) setLoading(true)
        try {
            // Use the provided range, or fall back to the initial 2-week window
            const range = (startIso && endIso)
                ? { start: startIso, end: endIso }
                : getWeekRange()

            const [stationsResult, bookingsResult] = await Promise.all([
                getStations(),
                getBookingsForDateRange(range.start, range.end)
            ])

            if (stationsResult.data) {
                // Sort stations by numeric suffix so they appear 1→2→3→4
                const sorted = [...stationsResult.data].sort((a, b) => {
                    const numA = parseInt(a.name.replace(/\D/g, ''), 10)
                    const numB = parseInt(b.name.replace(/\D/g, ''), 10)
                    return (isNaN(numA) ? 999 : numA) - (isNaN(numB) ? 999 : numB)
                })
                setStations(sorted)
            }
            if (bookingsResult.data) {
                setBookings(bookingsResult.data)
            }
            if (bookingsResult.currentUserId) {
                setCurrentUserId(bookingsResult.currentUserId)
            }
        } catch {
            toast.error('Failed to load calendar data')
        } finally {
            if (showSpinner) setLoading(false)
        }
    }

    // Called by FullCalendar whenever the visible date range changes.
    // showSpinner=false keeps FullCalendar mounted so datesSet doesn't re-fire (infinite loop).
    const handleDatesSet = (start: string, end: string) => {
        loadData(start, end, false)
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleBookingSuccess = () => {
        setIsDialogOpen(false)
        setPreselectedDate(undefined)
        setPreselectedStartTime(undefined)
        loadData() // reload current view range via datesSet instead
    }

    const handleDateSelect = (start: Date, end?: Date) => {
        setPreselectedDate(start)
        const hours = start.getHours().toString().padStart(2, '0')
        const minutes = start.getMinutes().toString().padStart(2, '0')
        setPreselectedStartTime(`${hours}:${minutes}`)

        if (end) {
            const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

            // Check if diffHours is one of our valid duration options (0.5 to 12)
            const validDurations = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12];

            // Find closest valid duration, default to '1' minimum 
            if (diffHours > 0) {
                const closest = validDurations.reduce((prev, curr) =>
                    Math.abs(curr - diffHours) < Math.abs(prev - diffHours) ? curr : prev
                );
                setPreselectedDuration(closest.toString());
            } else {
                setPreselectedDuration(undefined);
            }
        } else {
            setPreselectedDuration(undefined);
        }

        setIsDialogOpen(true)
    }

    // Filter bookings based on view mode
    const displayedBookings = viewMode === 'my-bookings' && currentUserId
        ? bookings.filter(b => b.user_id === currentUserId)
        : bookings

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-100 rounded-xl">
                                <CalendarDays className="w-8 h-8 text-slate-700" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">
                                    {viewMode === 'schedule' ? 'Kitchen Schedule' : 'My Bookings'}
                                </h1>
                                <p className="text-slate-500">
                                    {viewMode === 'schedule'
                                        ? 'Click on a time slot to book, or use the button below'
                                        : 'Showing only your reservations'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => loadData()} disabled={loading} size="lg">
                                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-slate-900 hover:bg-slate-800 text-white" size="lg">
                                        <Plus className="mr-2 h-5 w-5" />
                                        New Booking
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl">Book Kitchen Station</DialogTitle>
                                    </DialogHeader>
                                    <BookingForm
                                        key={`${preselectedDate?.toISOString()}-${preselectedStartTime}-${preselectedDuration}`}
                                        stations={stations}
                                        preselectedStation={selectedStations.length === 1 ? selectedStations[0] : undefined}
                                        preselectedDate={preselectedDate}
                                        preselectedStartTime={preselectedStartTime}
                                        preselectedDuration={preselectedDuration}
                                        onSuccess={handleBookingSuccess}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* View Toggle + Station Filter Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1">
                    <div className="flex items-center gap-2 overflow-x-auto p-2 scrollbar-hide">
                        {/* View Mode Toggle */}
                        <button
                            onClick={() => setViewMode('schedule')}
                            className={`flex-none px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'schedule'
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                        >
                            <CalendarDays className="w-3.5 h-3.5" />
                            All Stations
                        </button>
                        <button
                            onClick={() => setViewMode('my-bookings')}
                            className={`flex-none px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'my-bookings'
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            My Bookings
                        </button>

                        {/* Divider */}
                        <div className="w-px h-6 bg-slate-200 mx-1 flex-none" />

                        {/* Station Filters — sorted 1→4, shown only in schedule mode */}
                        {viewMode === 'schedule' && (
                            <>
                                <button
                                    onClick={() => { setSelectedStations([]); setExpandedStationIds([]); }}
                                    className={`flex-none px-3 py-2 rounded-full text-sm font-medium transition-all ${selectedStations.length === 0
                                        ? 'bg-teal-600 text-white shadow-md'
                                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                        }`}
                                >
                                    All
                                </button>
                                {stations.map((station) => {
                                    const isSelected = selectedStations.includes(station.id);
                                    const isExpanded = expandedStationIds.includes(station.id);
                                    const colorClass = stationColors[station.name] || 'bg-slate-500';

                                    return (
                                        <button
                                            key={station.id}
                                            onClick={() => {
                                                // Toggle selection
                                                if (isSelected) {
                                                    setSelectedStations(selectedStations.filter(id => id !== station.id));
                                                } else {
                                                    setSelectedStations([...selectedStations, station.id]);
                                                }
                                                // Toggle equipment bubble for this station
                                                setExpandedStationIds(isExpanded
                                                    ? expandedStationIds.filter(id => id !== station.id)
                                                    : [...expandedStationIds, station.id]);
                                            }}
                                            className={`flex-none px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isSelected
                                                ? `${colorClass} text-white shadow-md`
                                                : isExpanded
                                                    ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-white' : colorClass}`} />
                                            {station.name}
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Equipment bubbles — shown below filter row for each expanded station */}
                    {viewMode === 'schedule' && expandedStationIds.length > 0 && (
                        <div className="px-3 pb-3 pt-1 space-y-2">
                            {stations
                                .filter(s => expandedStationIds.includes(s.id) && s.equipment)
                                .map(station => {
                                    const items = station.equipment!.split(',').map(s => s.trim()).filter(Boolean);
                                    const colorClass = stationColors[station.name] || 'bg-slate-500';
                                    return (
                                        <div key={station.id} className="animate-in fade-in slide-in-from-top-1 duration-150">
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${colorClass}`} />
                                                    {station.name} — Equipment
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {items.map((item, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-sm"
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 gap-4">
                            <RefreshCw className="w-10 h-10 animate-spin text-slate-400" />
                            <p className="text-slate-500">Loading schedule...</p>
                        </div>
                    ) : (
                        <BookingCalendar
                            bookings={displayedBookings}
                            stations={stations}
                            selectedStations={selectedStations}
                            currentUserId={currentUserId}
                            onDateSelect={handleDateSelect}
                            onDatesSet={handleDatesSet}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
