"use client"

import { useState, useCallback } from 'react'
import { startOfWeek, addDays, isToday, format } from 'date-fns'
import { Station, Booking } from '@/app/actions/bookings'
import { getStationHex } from '@/lib/station-colors'
import { formatTimePST, durationLabel } from '@/utils/timezone'

const COMPACT_ROW_HEIGHT = 40   // px when station has no bookings this week
const STATION_ROW_HEIGHT = 64   // px when station has bookings (single)
const PREP_ROW_HEIGHT = 80      // px when General station has concurrent bookings
const LABEL_COL_WIDTH = 196     // px — wide enough for "Dairy Clean Room" + equipment

interface ResourceWeekViewProps {
  bookings: Booking[]
  stations: Station[]
  selectedStations: number[]
  currentUserId: string | null
  currentDate: Date
  onDayClick: (date: Date, stationId?: number) => void
  onEventClick: (booking: Booking, station: Station, rect: DOMRect) => void
}

function isSameDayLocal(bookingIso: string, date: Date): boolean {
  const b = new Date(bookingIso)
  return (
    b.getFullYear() === date.getFullYear() &&
    b.getMonth() === date.getMonth() &&
    b.getDate() === date.getDate()
  )
}

export function ResourceWeekView({
  bookings,
  stations,
  selectedStations,
  currentUserId,
  currentDate,
  onDayClick,
  onEventClick,
}: ResourceWeekViewProps) {
  const [hoveredCell, setHoveredCell] = useState<{ stationId: number; dayIdx: number } | null>(null)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const visibleStations =
    selectedStations.length > 0
      ? stations.filter((s) => selectedStations.includes(s.id))
      : stations

  const handleCellClick = useCallback(
    (e: React.MouseEvent, date: Date, station: Station) => {
      if ((e.target as HTMLElement).closest('[data-bar]')) return
      onDayClick(date, station.id)
    },
    [onDayClick]
  )

  const handleBarClick = useCallback(
    (e: React.MouseEvent, booking: Booking, station: Station) => {
      e.stopPropagation()
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      onEventClick(booking, station, rect)
    },
    [onEventClick]
  )

  return (
    <div className="resource-week-view w-full overflow-x-auto">
      <table className="w-full border-collapse min-w-[700px]" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: LABEL_COL_WIDTH }} />
          {days.map((_, i) => (
            <col key={i} />
          ))}
        </colgroup>

        {/* Header row: day names + dates */}
        <thead>
          <tr>
            {/* Empty corner cell */}
            <th className="border-b-2 border-r border-slate-200 bg-slate-50 p-2" />
            {days.map((day, i) => {
              const today = isToday(day)
              return (
                <th
                  key={i}
                  className={`border-b-2 border-r border-slate-200 p-2 text-center ${
                    today ? 'bg-teal-50 border-b-teal-400' : 'bg-slate-50 border-b-slate-200'
                  }`}
                >
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-widest ${
                      today ? 'text-teal-500' : 'text-slate-400'
                    }`}
                  >
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={`text-base font-bold mt-0.5 ${
                      today ? 'text-teal-700' : 'text-slate-700'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {visibleStations.map((station, stationIdx) => {
            const hex = getStationHex(station.name)
            const isLast = stationIdx === visibleStations.length - 1

            // Dynamic height: compact when empty, taller when concurrent bookings exist
            const stationWeekBookings = bookings.filter(b => b.station_id === station.id)
            const maxConcurrent = Math.max(0, ...days.map(day =>
              stationWeekBookings.filter(b => isSameDayLocal(b.start_time, day)).length
            ))
            const rowHeight = maxConcurrent === 0 ? COMPACT_ROW_HEIGHT
              : maxConcurrent >= 2 ? PREP_ROW_HEIGHT
              : STATION_ROW_HEIGHT

            return (
              <tr key={station.id}>
                {/* Station label column */}
                <td
                  className={`border-r border-slate-200 bg-white px-3 py-2 align-middle ${
                    !isLast ? 'border-b border-slate-100' : ''
                  }`}
                  style={{ height: rowHeight, borderLeft: `4px solid ${hex}` }}
                >
                  <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                    {station.name}
                  </p>
                  {station.equipment && (
                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                      {station.equipment}
                    </p>
                  )}
                </td>

                {/* Day cells */}
                {days.map((day, dayIdx) => {
                  const dayBookings = bookings
                    .filter((b) => b.station_id === station.id && isSameDayLocal(b.start_time, day))
                    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

                  const isHovered =
                    hoveredCell?.stationId === station.id && hoveredCell?.dayIdx === dayIdx
                  const hasBookings = dayBookings.length > 0
                  const isCurrentDay = isToday(day)

                  return (
                    <td
                      key={dayIdx}
                      className={`relative border-r border-slate-200 cursor-pointer transition-colors align-top ${
                        !isLast ? 'border-b border-slate-100' : ''
                      } ${
                        isCurrentDay && hasBookings ? 'bg-teal-50/20'
                          : isCurrentDay ? 'bg-teal-50/40'
                          : isHovered && !hasBookings ? 'bg-emerald-50'
                          : 'bg-white'
                      }`}
                      style={{ height: rowHeight }}
                      onClick={(e) => handleCellClick(e, day, station)}
                      onMouseEnter={() => setHoveredCell({ stationId: station.id, dayIdx })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={hasBookings ? undefined : `Book ${station.name} on ${format(day, 'EEE M/d')}`}
                    >
                      {/* Booking chips */}
                      <div className="p-1 space-y-1 h-full overflow-hidden">
                        {dayBookings.map((booking) => {
                          const isOwn = currentUserId && booking.user_id === currentUserId
                          const label = booking.profile?.company_name || 'Reserved'
                          const timeStr = `${formatTimePST(booking.start_time)}–${formatTimePST(booking.end_time)}`

                          return (
                            <div
                              key={booking.id}
                              data-bar
                              className={`rounded-md px-2 py-1.5 text-white text-xs font-semibold truncate cursor-pointer hover:brightness-90 transition-all leading-tight ${
                                isOwn ? 'ring-1 ring-slate-900/30 ring-offset-1' : ''
                              }`}
                              style={{ backgroundColor: hex }}
                              onClick={(e) => handleBarClick(e, booking, station)}
                              title={`${isOwn ? '★ ' : ''}${timeStr} · ${label} (${durationLabel(booking.start_time, booking.end_time)})`}
                            >
                              {isOwn && '★ '}
                              <span>{timeStr}</span>
                              <span className="text-white/70 font-normal"> · {label}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* "Book" on hover — every cell is bookable */}
                      {isHovered && (
                        <div className="absolute bottom-1.5 right-1.5 pointer-events-none">
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md leading-none">
                            + Book
                          </span>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
