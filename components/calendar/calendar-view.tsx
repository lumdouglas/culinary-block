"use client"

import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Station, Booking } from '@/app/actions/bookings'
import { getStationHex } from '@/lib/station-colors'
import { BookingPopup, PopupState } from '@/components/calendar/booking-popup'

interface BookingCalendarProps {
  bookings: Booking[]
  stations: Station[]
  selectedStations: number[]
  currentUserId?: string | null
  onDateSelect?: (start: Date, end: Date) => void
  onDatesSet?: (start: string, end: string) => void
}

export function BookingCalendar({
  bookings,
  stations,
  selectedStations,
  currentUserId,
  onDateSelect,
  onDatesSet,
}: BookingCalendarProps) {
  const [popup, setPopup] = useState<PopupState | null>(null)

  useEffect(() => {
    if (!popup) return
    const close = (e: MouseEvent) => {
      const el = document.getElementById('booking-popup')
      if (el && !el.contains(e.target as Node)) setPopup(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [popup])

  const filteredBookings = selectedStations.length > 0
    ? bookings.filter(b => selectedStations.includes(b.station_id))
    : bookings

  const events = filteredBookings.map((booking) => {
    const station = stations.find((s) => s.id === booking.station_id)
    const stationName = station?.name || 'Reserved'
    const companyName = booking.profile?.company_name || 'Reserved'
    const color = getStationHex(stationName)
    const isOwnBooking = currentUserId && booking.user_id === currentUserId
    const title = isOwnBooking ? `★ ${stationName}\n${companyName}` : `${stationName}\n${companyName}`

    return {
      id: booking.id,
      title,
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
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        events={events}
        height="auto"
        nowIndicator={true}
        editable={false}
        selectable={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        datesSet={(info) => onDatesSet?.(info.startStr, info.endStr)}
        timeZone="America/Los_Angeles"
        weekends={true}
        dayMaxEvents={true}
        eventDisplay="auto"
      />

      {popup && <BookingPopup popup={popup} currentUserId={currentUserId} onClose={() => setPopup(null)} />}

      <style jsx global>{`
        .fc { font-family: inherit; }
        .fc-toolbar-title { font-size: 1.4rem !important; font-weight: 700; color: #1e293b; }
        .fc-button-primary {
          background-color: #1e293b !important;
          border: none !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          padding: 0.5rem 1rem !important;
          font-size: 0.9rem !important;
        }
        .fc-button-primary:hover { background-color: #334155 !important; }
        .fc-button-primary:disabled { background-color: #94a3b8 !important; }
        .fc-button-active { background-color: #0f172a !important; }
        .fc-col-header-cell { background-color: #f8fafc; padding: 0.75rem 0 !important; }
        .fc-col-header-cell-cushion { color: #334155; font-weight: 600; font-size: 0.9rem; }
        .fc-event { border-radius: 4px !important; font-size: 0.78rem !important; padding: 1px 4px !important; cursor: pointer !important; }
        .fc-event-title {
          white-space: pre-wrap !important;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .fc-daygrid-day-top { padding: 6px; }
        .fc-scrollgrid { border-radius: 12px !important; overflow: hidden; }
        .fc-scrollgrid td, .fc-scrollgrid th { border-color: #e2e8f0 !important; }
        .own-booking { border-width: 2px !important; border-style: solid !important; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25) !important; }
      `}</style>
    </div>
  )
}
