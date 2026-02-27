"use client"

import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { Station, Booking } from '@/app/actions/bookings'
import { formatTimePST, formatLongDatePST, formatDayPST, durationLabel } from '@/utils/timezone'
import { X, Clock, MapPin, User, FileText } from 'lucide-react'

// Station color mapping
const stationColors: Record<string, string> = {
  'Station 1': '#0d9488',
  'Station 3': '#14b8a6',
  'Station 2': '#2563eb',
  'Station 4': '#3b82f6',
  'Oven L': '#16a34a',
  'Oven M': '#22c55e',
  'Oven R': '#4ade80',
  'General Kitchen': '#f59e0b',
}

interface BookingCalendarProps {
  bookings: Booking[]
  stations: Station[]
  selectedStations: number[]
  currentUserId?: string | null
  onDateSelect?: (start: Date, end: Date) => void
  onDatesSet?: (start: string, end: string) => void
}

interface PopupState {
  booking: Booking
  station: Station | undefined
  x: number
  y: number
}

export function BookingCalendar({
  bookings,
  stations,
  selectedStations,
  currentUserId,
  onDateSelect,
  onDatesSet,
}: BookingCalendarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [popup, setPopup] = useState<PopupState | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close popup when clicking outside
  useEffect(() => {
    if (!popup) return
    const close = (e: MouseEvent) => {
      const el = document.getElementById('booking-popup')
      if (el && !el.contains(e.target as Node)) setPopup(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [popup])

  // Filter bookings by selected stations
  const filteredBookings = selectedStations.length > 0
    ? bookings.filter(b => selectedStations.includes(b.station_id))
    : bookings

  // Map bookings to FullCalendar events — title is just station name
  const events = filteredBookings.map((booking) => {
    const station = stations.find((s) => s.id === booking.station_id)
    const stationName = station?.name || 'Reserved'
    const color = stationColors[stationName] || '#6b7280'
    const isOwnBooking = currentUserId && booking.user_id === currentUserId

    return {
      id: booking.id,
      title: isOwnBooking ? `★ ${stationName}` : stationName,
      start: booking.start_time,
      end: booking.end_time,
      backgroundColor: color,
      borderColor: isOwnBooking ? '#0f172a' : color,
      textColor: '#ffffff',
      classNames: isOwnBooking ? ['own-booking'] : [],
      extendedProps: { booking, station },
    }
  })

  const handleDateSelect = (selectInfo: { start: Date; end: Date }) => {
    if (onDateSelect) onDateSelect(selectInfo.start, selectInfo.end)
  }

  const handleEventClick = (clickInfo: any) => {
    const { booking, station } = clickInfo.event.extendedProps as {
      booking: Booking
      station: Station | undefined
    }

    // Calculate popup position from the event element
    // fixed positioning uses viewport coords, so no scrollY offset needed
    const rect = (clickInfo.el as HTMLElement).getBoundingClientRect()

    setPopup({
      booking,
      station,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
  }

  return (
    <div className="calendar-container relative">
      <FullCalendar
        key={isMobile ? 'mobile' : 'desktop'}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
        headerToolbar={{
          left: isMobile ? 'prev,next' : 'prev,next today',
          center: 'title',
          right: isMobile ? 'timeGridDay,listWeek' : 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        height={isMobile ? "80vh" : "70vh"}
        contentHeight={undefined}
        aspectRatio={isMobile ? 0.8 : 1.35}
        nowIndicator={true}
        editable={false}
        selectable={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        datesSet={(info) => onDatesSet?.(info.startStr, info.endStr)}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="07:00:00"
        slotDuration="00:30:00"
        allDaySlot={false}
        weekends={true}
        selectMirror={true}
        dayMaxEvents={true}
        eventDisplay={isMobile ? 'block' : 'auto'}
      />

      {/* Booking detail popup */}
      {popup && <BookingPopup popup={popup} currentUserId={currentUserId} onClose={() => setPopup(null)} />}

      <style jsx global>{`
        .fc { font-family: inherit; }
        .fc-toolbar-title { font-size: ${isMobile ? '1.1rem' : '1.5rem'} !important; font-weight: 700; color: #1e293b; }
        .fc-button-primary { 
          background-color: #1e293b !important; 
          border: none !important; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          padding: ${isMobile ? '0.4rem 0.6rem' : '0.5rem 1rem'} !important;
          font-size: ${isMobile ? '0.8rem' : '1rem'} !important;
        }
        .fc-button-primary:hover { background-color: #334155 !important; }
        .fc-button-primary:disabled { background-color: #94a3b8 !important; }
        .fc-button-active { background-color: #0f172a !important; }
        .fc-timegrid-slot { height: 2.5em; }
        .fc-timegrid-slot-label { font-size: 0.75rem; color: #64748b; }
        .fc-col-header-cell { background-color: #f8fafc; padding: 0.75rem 0 !important; }
        .fc-col-header-cell-cushion { color: #334155; font-weight: 600; font-size: ${isMobile ? '0.8rem' : '1rem'}; }
        .fc-event { border-radius: 6px !important; font-size: ${isMobile ? '0.7rem' : '0.8rem'} !important; padding: 2px 6px !important; cursor: pointer !important; }
        .fc-timegrid-now-indicator-line { border-color: #ef4444 !important; }
        .fc-daygrid-day-top { padding: 8px; }
        .fc-scrollgrid { border-radius: 12px !important; overflow: hidden; }
        .fc-scrollgrid td, .fc-scrollgrid th { border-color: #e2e8f0 !important; }
        .own-booking { border-width: 2px !important; border-style: solid !important; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25) !important; }
        @media (max-width: 768px) {
          .fc-toolbar { flex-direction: column; gap: 0.5rem; margin-bottom: 1rem !important; }
          .fc-toolbar-chunk { display: flex; justify-content: center; width: 100%; }
        }
        .fc-list-event-title { color: #0f172a !important; font-weight: 500 !important; }
        .fc-list-event-time { color: #334155 !important; }
        .fc-list-day-text { color: #0f172a !important; font-weight: 700 !important; }
        .fc-list-day-side-text { color: #334155 !important; }
        .fc-list-table td { border-color: #e2e8f0 !important; }
      `}</style>
    </div>
  )
}

function BookingPopup({
  popup,
  currentUserId,
  onClose,
}: {
  popup: PopupState
  currentUserId?: string | null
  onClose: () => void
}) {
  const { booking, station, x, y } = popup
  const isOwn = currentUserId && booking.user_id === currentUserId
  const duration = durationLabel(booking.start_time, booking.end_time)
  const color = stationColors[station?.name || ''] || '#6b7280'

  // Clamp horizontally so popup stays within viewport
  const popupWidth = 288 // w-72
  const clampedX = Math.min(Math.max(x - popupWidth / 2, 12), window.innerWidth - popupWidth - 12)

  return (
    <div
      id="booking-popup"
      className="fixed z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{ left: clampedX, top: y }}
    >
      {/* Colour header strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      <div className="p-4 space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-slate-900 text-base leading-tight">
              {isOwn ? '★ ' : ''}{station?.name ?? 'Kitchen Station'}
            </p>
            {station?.category && (
              <p className="text-xs text-slate-400 mt-0.5">{station.category}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors flex-shrink-0 mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {/* Tenant */}
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="font-medium">
              {isOwn ? 'You' : (booking.profile?.company_name || 'Reserved')}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-slate-600">
            <div className="w-4 flex justify-center">
              <span className="text-xs font-bold text-slate-400">{formatDayPST(booking.start_time)}</span>
            </div>
            <span>{formatLongDatePST(booking.start_time)}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>
              {formatTimePST(booking.start_time)} – {formatTimePST(booking.end_time)}
              <span className="text-slate-400 ml-1">({duration})</span>
            </span>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="flex items-start gap-2 text-slate-600">
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-500 italic">{booking.notes}</span>
            </div>
          )}

          {/* Equipment */}
          {station?.equipment && (
            <div className="flex items-start gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-500">{station.equipment}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}