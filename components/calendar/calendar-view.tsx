"use client"

import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Kitchen } from '@/types/database'

interface BookingCalendarProps {
  initialEvents: any[]
  kitchens: Kitchen[]
}

export function BookingCalendar({ initialEvents, kitchens }: BookingCalendarProps) {
  // Map our database bookings to FullCalendar events
  const events = initialEvents.map((booking) => {
    const kitchen = kitchens.find((k) => k.id === booking.kitchen_id)
    return {
      id: booking.id,
      title: `${kitchen?.name || 'Kitchen'} - ${booking.profiles?.company_name || 'Reserved'}`,
      start: booking.start_time,
      end: booking.end_time,
      backgroundColor: kitchen?.color_code || '#3b82f6',
      borderColor: kitchen?.color_code || '#3b82f6',
      extendedProps: { ...booking }
    }
  })

  return (
    <div className="calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        height="70vh"
        nowIndicator={true}
        editable={false} // Only admins or owners should drag; keep simple for now
        selectable={true}
        slotMinTime="05:00:00" // Kitchens usually open early
        slotMaxTime="23:00:00"
        allDaySlot={false}
      />
      <style jsx global>{`
        .fc { font-family: inherit; }
        .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 600; }
        .fc-button-primary { background-color: #0f172a !important; border: none !important; }
      `}</style>
    </div>
  )
}