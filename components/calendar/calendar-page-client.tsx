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
    'Hood1R': 'bg-teal-600',
    'Hood1L': 'bg-teal-500',
    'Hood2R': 'bg-blue-600',
    'Hood2L': 'bg-blue-500',
    'Oven L': 'bg-green-600',
    'Oven M': 'bg-green-500',
    'Oven R': 'bg-green-400',
    'General Kitchen': 'bg-amber-500',
}

type ViewMode = 'schedule' | 'my-bookings'

export default function CalendarPageClient() {
    const [stations, setStations] = useState<Station[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [selectedStations, setSelectedStations] = useState<number[]>([])
    const [viewMode, setViewMode] = useState<ViewMode>('schedule')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined)
    const [preselectedStartTime, setPreselectedStartTime] = useState<string | undefined>(undefined)

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

    const loadData = async () => {
        setLoading(true)
        try {
            const [stationsResult, bookingsResult] = await Promise.all([
                getStations(),
                getBookingsForDateRange(getWeekRange().start, getWeekRange().end)
            ])

            if (stationsResult.data) {
                setStations(stationsResult.data)
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
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleBookingSuccess = () => {
        setIsDialogOpen(false)
        setPreselectedDate(undefined)
        setPreselectedStartTime(undefined)
        loadData()
    }

    const handleDateSelect = (start: Date) => {
        setPreselectedDate(start)
        const hours = start.getHours().toString().padStart(2, '0')
        const minutes = start.getMinutes().toString().padStart(2, '0')
        setPreselectedStartTime(`${hours}:${minutes}`)
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
                            <Button variant="outline" onClick={loadData} disabled={loading} size="lg">
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
                                        key={`${preselectedDate?.toISOString()}-${preselectedStartTime}`}
                                        stations={stations}
                                        preselectedStation={selectedStations.length === 1 ? selectedStations[0] : undefined}
                                        preselectedDate={preselectedDate}
                                        preselectedStartTime={preselectedStartTime}
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

                        {/* Station Filters (only show in schedule mode) */}
                        {viewMode === 'schedule' && (
                            <>
                                <button
                                    onClick={() => setSelectedStations([])}
                                    className={`flex-none px-3 py-2 rounded-full text-sm font-medium transition-all ${selectedStations.length === 0
                                        ? 'bg-teal-600 text-white shadow-md'
                                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                        }`}
                                >
                                    All
                                </button>
                                {stations.map((station) => {
                                    const isSelected = selectedStations.includes(station.id);
                                    const colorClass = stationColors[station.name] || 'bg-slate-500';

                                    return (
                                        <button
                                            key={station.id}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedStations(selectedStations.filter(id => id !== station.id));
                                                } else {
                                                    setSelectedStations([...selectedStations, station.id]);
                                                }
                                            }}
                                            className={`flex-none px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isSelected
                                                ? 'bg-slate-900 text-white shadow-md ring-1 ring-slate-900'
                                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : colorClass}`} />
                                            {station.name}
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>
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
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
