"use client"

import { useState, useEffect } from 'react'
import { getStations, getBookingsForDateRange, Station, Booking } from '@/app/actions/bookings'
import { BookingCalendar } from '@/components/calendar/calendar-view'
import { BookingForm } from '@/components/calendar/booking-modal'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, CalendarDays, Filter, ChevronDown, ChevronUp } from 'lucide-react'
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

export default function CalendarPageClient() {
    const [stations, setStations] = useState<Station[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [selectedStation, setSelectedStation] = useState<number | null>(null)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
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
        } catch (error) {
            toast.error('Failed to load calendar data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleBookingSuccess = () => {
        setIsDialogOpen(false)
        setPreselectedDate(undefined)
        setPreselectedStartTime(undefined)
        loadData()
    }

    const handleDateSelect = (start: Date, end: Date) => {
        // Extract date and time from selection
        setPreselectedDate(start)
        const hours = start.getHours().toString().padStart(2, '0')
        const minutes = start.getMinutes().toString().padStart(2, '0')
        setPreselectedStartTime(`${hours}:${minutes}`)
        setIsDialogOpen(true)
    }

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
                                <h1 className="text-2xl font-bold text-slate-900">Kitchen Schedule</h1>
                                <p className="text-slate-500">Click on a time slot to book, or use the button below</p>
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
                                        preselectedStation={selectedStation || undefined}
                                        preselectedDate={preselectedDate}
                                        preselectedStartTime={preselectedStartTime}
                                        onSuccess={handleBookingSuccess}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>

                {/* Station Filter */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center justify-between w-full focus:outline-none"
                    >
                        <div className="flex items-center gap-3">
                            <Filter className="w-5 h-5 text-slate-500" />
                            <span className="font-semibold text-slate-700">Filter by Station</span>
                        </div>
                        {isFilterOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                    </button>

                    {isFilterOpen && (
                        <div className="flex items-center gap-2 flex-wrap mt-4 animate-in slide-in-from-top-2 duration-200">
                            <button
                                onClick={() => setSelectedStation(null)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedStation === null
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                All Stations
                            </button>
                            {stations.map((station) => (
                                <button
                                    key={station.id}
                                    onClick={() => setSelectedStation(station.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedStation === station.id
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    <span className={`w-3 h-3 rounded-full ${stationColors[station.name] || 'bg-gray-500'}`} />
                                    {station.name}
                                </button>
                            ))}
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
                            bookings={bookings}
                            stations={stations}
                            selectedStation={selectedStation}
                            onDateSelect={handleDateSelect}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
