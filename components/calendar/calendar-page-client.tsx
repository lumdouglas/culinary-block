"use client"

import { useState, useEffect, useCallback } from 'react'
import { getStations, getBookingsForDateRange, Station, Booking } from '@/app/actions/bookings'
import { BookingCalendar } from '@/components/calendar/calendar-view'
import { ResourceDayView } from '@/components/calendar/resource-day-view'
import { ResourceWeekView } from '@/components/calendar/resource-week-view'
import { BookingPopup, PopupState } from '@/components/calendar/booking-popup'
import { BookingForm } from '@/components/calendar/booking-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getStationBg } from '@/lib/station-colors'
import { Plus, RefreshCw, CalendarDays, User, ChevronLeft, ChevronRight, Columns3, CalendarRange, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { format, addDays, subDays, addWeeks, subWeeks, startOfDay, startOfWeek, endOfWeek } from 'date-fns'

type ViewMode = 'schedule' | 'my-bookings'
type CalendarView = 'day' | 'week' | 'month'

export default function CalendarPageClient() {
    const [stations, setStations] = useState<Station[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState<boolean>(false)
    const [selectedStations, setSelectedStations] = useState<number[]>([])
    const [expandedStationIds, setExpandedStationIds] = useState<number[]>([])
    const [viewMode, setViewMode] = useState<ViewMode>('schedule')
    const [calendarView, setCalendarView] = useState<CalendarView>('week')
    const [currentDate, setCurrentDate] = useState<Date>(() => startOfDay(new Date()))
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined)
    const [preselectedStartTime, setPreselectedStartTime] = useState<string | undefined>(undefined)
    const [preselectedDuration, setPreselectedDuration] = useState<string | undefined>(undefined)
    const [preselectedStationId, setPreselectedStationId] = useState<number | undefined>(undefined)
    const [popup, setPopup] = useState<PopupState | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const check = () => {
            const mobile = window.innerWidth < 768
            setIsMobile(mobile)
            if (mobile) setCalendarView('day')
        }
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    // Close popup on outside click
    useEffect(() => {
        if (!popup) return
        const close = (e: MouseEvent) => {
            const el = document.getElementById('booking-popup')
            if (el && !el.contains(e.target as Node)) setPopup(null)
        }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [popup])

    // Keyboard navigation for day view
    useEffect(() => {
        if (calendarView !== 'day') return
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
            if (e.key === 'ArrowLeft') navigate('prev')
            else if (e.key === 'ArrowRight') navigate('next')
            else if (e.key === 'Escape') setPopup(null)
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calendarView])

    const getDayRange = useCallback((date: Date) => {
        const start = startOfDay(date)
        const end = addDays(start, 1)
        return { start: start.toISOString(), end: end.toISOString() }
    }, [])

    const getWeekRangeForDate = useCallback((date: Date) => {
        const start = startOfWeek(date, { weekStartsOn: 0 })
        const end = endOfWeek(date, { weekStartsOn: 0 })
        return { start: start.toISOString(), end: addDays(end, 1).toISOString() }
    }, [])

    const loadData = useCallback(async (startIso?: string, endIso?: string, showSpinner = true) => {
        if (showSpinner) setLoading(true)
        try {
            const range = (startIso && endIso)
                ? { start: startIso, end: endIso }
                : calendarView === 'day'
                    ? getDayRange(currentDate)
                    : getWeekRangeForDate(currentDate)

            const [stationsResult, bookingsResult] = await Promise.all([
                getStations(),
                getBookingsForDateRange(range.start, range.end)
            ])

            if (stationsResult.data) {
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
            if (bookingsResult.isAdmin !== undefined) {
                setIsAdmin(bookingsResult.isAdmin)
            }
        } catch {
            toast.error('Failed to load calendar data')
        } finally {
            if (showSpinner) setLoading(false)
        }
    }, [calendarView, currentDate, getDayRange])

    const handleDatesSet = useCallback((start: string, end: string) => {
        loadData(start, end, false)
    }, [loadData])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleBookingSuccess = () => {
        setIsDialogOpen(false)
        setPreselectedDate(undefined)
        setPreselectedStartTime(undefined)
        setPreselectedStationId(undefined)
        loadData()
    }

    const handleDateSelect = (start: Date, end?: Date, stationId?: number) => {
        setPreselectedDate(start)
        const hours = start.getHours().toString().padStart(2, '0')
        const minutes = start.getMinutes().toString().padStart(2, '0')
        setPreselectedStartTime(`${hours}:${minutes}`)
        setPreselectedStationId(stationId)

        if (end) {
            const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            const validDurations = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12]
            if (diffHours > 0) {
                const closest = validDurations.reduce((prev, curr) =>
                    Math.abs(curr - diffHours) < Math.abs(prev - diffHours) ? curr : prev
                )
                setPreselectedDuration(closest.toString())
            } else {
                setPreselectedDuration(undefined)
            }
        } else {
            setPreselectedDuration(undefined)
        }
        setIsDialogOpen(true)
    }

    const handleEventClick = (booking: Booking, station: Station, rect: DOMRect) => {
        setPopup({
            booking,
            station,
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
        })
    }

    const navigate = (direction: 'prev' | 'next' | 'today') => {
        setPopup(null)
        if (direction === 'today') {
            setCurrentDate(startOfDay(new Date()))
        } else if (calendarView === 'week') {
            setCurrentDate((d) => direction === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1))
        } else {
            setCurrentDate((d) => direction === 'prev' ? subDays(d, 1) : addDays(d, 1))
        }
    }

    // Week view: clicking a cell opens the booking dialog for that date + station
    const handleWeekDayClick = (date: Date, stationId?: number) => {
        const start = new Date(date)
        start.setHours(9, 0, 0, 0)
        handleDateSelect(start, undefined, stationId)
    }

    const displayedBookings = viewMode === 'my-bookings' && currentUserId
        ? bookings.filter(b => b.user_id === currentUserId)
        : bookings

    const resolvedPreselectedStation = preselectedStationId
        ?? (selectedStations.length === 1 ? selectedStations[0] : undefined)

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">

                {/* Controls card: title + actions + toggles in one compact block */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100">

                    {/* Top row: title + Refresh + New Booking */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                        <h1 className="text-base font-bold text-slate-900 flex-1">
                            {viewMode === 'schedule' ? 'Kitchen Schedule' : 'My Bookings'}
                        </h1>
                        <Button variant="outline" size="sm" onClick={() => loadData()} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    New Booking
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="text-xl">Book Kitchen Station</DialogTitle>
                                </DialogHeader>
                                <BookingForm
                                    key={`${preselectedDate?.toISOString()}-${preselectedStartTime}-${preselectedDuration}-${preselectedStationId}`}
                                    stations={stations}
                                    preselectedStation={resolvedPreselectedStation}
                                    preselectedDate={preselectedDate}
                                    preselectedStartTime={preselectedStartTime}
                                    preselectedDuration={preselectedDuration}
                                    onSuccess={handleBookingSuccess}
                                    isAdmin={isAdmin}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Toggle row */}
                    <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 scrollbar-hide">
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

                        <div className="w-px h-6 bg-slate-200 mx-1 flex-none" />

                        {/* Calendar View Toggle */}
                        <div className="flex-none flex bg-slate-100 rounded-full p-0.5">
                            <button
                                onClick={() => setCalendarView('day')}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                                    calendarView === 'day'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Columns3 className="w-3.5 h-3.5" />
                                Day
                            </button>
                            {!isMobile && (
                                <>
                                    <button
                                        onClick={() => setCalendarView('week')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                                            calendarView === 'week'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <CalendarRange className="w-3.5 h-3.5" />
                                        Week
                                    </button>
                                    <button
                                        onClick={() => setCalendarView('month')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                                            calendarView === 'month'
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                        Month
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Month: interactive station filter pills */}
                        {viewMode === 'schedule' && calendarView === 'month' && (
                            <>
                                <div className="w-px h-6 bg-slate-200 mx-1 flex-none" />
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
                                    const isSelected = selectedStations.includes(station.id)
                                    const isExpanded = expandedStationIds.includes(station.id)
                                    const colorClass = getStationBg(station.name)
                                    return (
                                        <button
                                            key={station.id}
                                            onClick={() => {
                                                setSelectedStations(isSelected
                                                    ? selectedStations.filter(id => id !== station.id)
                                                    : [...selectedStations, station.id])
                                                setExpandedStationIds(isExpanded
                                                    ? expandedStationIds.filter(id => id !== station.id)
                                                    : [...expandedStationIds, station.id])
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
                                    )
                                })}
                            </>
                        )}
                    </div>

                    {/* Equipment bubbles — month view only */}
                    {viewMode === 'schedule' && calendarView === 'month' && expandedStationIds.length > 0 && (
                        <div className="px-3 pb-3 pt-1 space-y-2">
                            {stations
                                .filter(s => expandedStationIds.includes(s.id) && s.equipment)
                                .map(station => {
                                    const items = station.equipment!.split(',').map(s => s.trim()).filter(Boolean)
                                    const colorClass = getStationBg(station.name)
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
                                    )
                                })
                            }
                        </div>
                    )}
                </div>

                {/* Navigation bar — shown for day and week custom views */}
                {(calendarView === 'day' || calendarView === 'week') && (
                    <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate('prev')}
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <button
                                onClick={() => navigate('today')}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => navigate('next')}
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">
                            {calendarView === 'day'
                                ? format(currentDate, 'EEEE, MMMM d, yyyy')
                                : (() => {
                                    const ws = startOfWeek(currentDate, { weekStartsOn: 0 })
                                    const we = endOfWeek(currentDate, { weekStartsOn: 0 })
                                    return ws.getMonth() === we.getMonth()
                                        ? `${format(ws, 'MMM d')} – ${format(we, 'd, yyyy')}`
                                        : `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
                                })()
                            }
                        </h2>
                        <div className="w-[140px]" />
                    </div>
                )}

                {/* Calendar */}
                <div className={`bg-white rounded-2xl shadow-lg border border-slate-100 ${calendarView === 'month' ? 'p-6' : 'p-4'}`}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 gap-4">
                            <RefreshCw className="w-10 h-10 animate-spin text-slate-400" />
                            <p className="text-slate-500">Loading schedule...</p>
                        </div>
                    ) : calendarView === 'day' ? (
                        <>
                            <ResourceDayView
                                bookings={displayedBookings}
                                stations={stations}
                                selectedStations={selectedStations}
                                currentUserId={currentUserId}
                                currentDate={currentDate}
                                onSlotSelect={(start, end, stationId) => handleDateSelect(start, end, stationId)}
                                onEventClick={handleEventClick}
                            />
                            {popup && (
                                <BookingPopup
                                    popup={popup}
                                    currentUserId={currentUserId}
                                    onClose={() => setPopup(null)}
                                />
                            )}
                        </>
                    ) : calendarView === 'week' ? (
                        <>
                            <ResourceWeekView
                                bookings={displayedBookings}
                                stations={stations}
                                selectedStations={selectedStations}
                                currentUserId={currentUserId}
                                currentDate={currentDate}
                                onDayClick={handleWeekDayClick}
                                onEventClick={handleEventClick}
                            />
                            {popup && (
                                <BookingPopup
                                    popup={popup}
                                    currentUserId={currentUserId}
                                    onClose={() => setPopup(null)}
                                />
                            )}
                        </>
                    ) : (
                        <BookingCalendar
                            bookings={displayedBookings}
                            stations={stations}
                            selectedStations={selectedStations}
                            currentUserId={currentUserId}
                            onDateSelect={(start, end) => handleDateSelect(start, end)}
                            onDatesSet={handleDatesSet}
                        />
                    )}
                </div>
            </div>

            {/* Floating action button — always visible while scrolling */}
            <button
                onClick={() => setIsDialogOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-full shadow-xl px-5 py-3.5 transition-all hover:shadow-2xl"
            >
                <Plus className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-semibold hidden sm:inline">New Booking</span>
            </button>
        </div>
    )
}
