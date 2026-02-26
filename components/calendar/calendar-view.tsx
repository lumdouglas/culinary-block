"use client"

import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list' // Added list plugin
import interactionPlugin from '@fullcalendar/interaction'
import { Station, Booking } from '@/app/actions/bookings'

// Station color mapping
const stationColors: Record<string, string> = {
  'Station 1': '#0d9488', // teal-600
  'Station 3': '#14b8a6', // teal-500
  'Station 2': '#2563eb', // blue-600
  'Station 4': '#3b82f6', // blue-500
  'Oven L': '#16a34a', // green-600
  'Oven M': '#22c55e', // green-500
  'Oven R': '#4ade80', // green-400
  'General Kitchen': '#f59e0b', // amber-500
}

interface BookingCalendarProps {
  bookings: Booking[]
  stations: Station[]
  selectedStations: number[]
  currentUserId?: string | null
  onDateSelect?: (start: Date, end: Date) => void
}

export function BookingCalendar({
  bookings,
  stations,
  selectedStations,
  currentUserId,
  onDateSelect
}: BookingCalendarProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkMobile()

    // Add listener
    window.addEventListener('resize', checkMobile)

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Filter bookings by selected stations
  const filteredBookings = selectedStations.length > 0
    ? bookings.filter(b => selectedStations.includes(b.station_id))
    : bookings

  // Map bookings to FullCalendar events
  const events = filteredBookings.map((booking) => {
    const station = stations.find((s) => s.id === booking.station_id)
    const stationName = station?.name || 'Unknown'
    const color = stationColors[stationName] || '#6b7280'
    const isOwnBooking = currentUserId && booking.user_id === currentUserId

    const equipmentInfo = station?.equipment ? ` (${station.equipment})` : ''
    const baseTitle = isOwnBooking
      ? `★ ${stationName} - ${booking.profile?.company_name || 'You'}`
      : `${stationName} - ${booking.profile?.company_name || 'Reserved'}`

    return {
      id: booking.id,
      title: baseTitle + equipmentInfo,
      start: booking.start_time,
      end: booking.end_time,
      backgroundColor: color,
      borderColor: isOwnBooking ? '#0f172a' : color,
      textColor: isOwnBooking ? '#ffffff' : undefined,
      classNames: isOwnBooking ? ['own-booking'] : [],
      extendedProps: { ...booking }
    }
  })

  const handleDateSelect = (selectInfo: { start: Date; end: Date }) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.end)
    }
  }

  return (
    <div className="calendar-container">
      <FullCalendar
        key={isMobile ? 'mobile' : 'desktop'} // Force re-render on view change
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]} // Added listPlugin
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
        .fc-event { border-radius: 6px !important; font-size: ${isMobile ? '0.7rem' : '0.8rem'} !important; padding: 2px 6px !important; }
        .fc-timegrid-now-indicator-line { border-color: #ef4444 !important; }
        .fc-daygrid-day-top { padding: 8px; }
        .fc-scrollgrid { border-radius: 12px !important; overflow: hidden; }
        .fc-scrollgrid td, .fc-scrollgrid th { border-color: #e2e8f0 !important; }

        /* Own booking highlight */
        .own-booking { border-width: 2px !important; border-style: solid !important; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25) !important; }
        

        /* Mobile specific adjustments */
        @media (max-width: 768px) {
          .fc-toolbar { flex-direction: column; gap: 0.5rem; margin-bottom: 1rem !important; }
          .fc-toolbar-chunk { display: flex; justify-content: center; width: 100%; }
        }

        /* List view text darkening */
        .fc-list-event-title { color: #0f172a !important; font-weight: 500 !important; }
        .fc-list-event-time { color: #334155 !important; }
        .fc-list-day-text { color: #0f172a !important; font-weight: 700 !important; }
        .fc-list-day-side-text { color: #334155 !important; }
        .fc-list-table td { border-color: #e2e8f0 !important; }
      `}</style>
    </div>
  )
}