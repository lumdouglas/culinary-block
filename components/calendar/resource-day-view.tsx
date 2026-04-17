"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Station, Booking } from '@/app/actions/bookings'
import { getStationHex } from '@/lib/station-colors'
import { formatTimePST, durationLabel } from '@/utils/timezone'

// Operating window: 4am–10pm = 18 hours = 1080 minutes
const HOUR_START = 4
const HOUR_END = 22
const DAY_MINUTES = (HOUR_END - HOUR_START) * 60

// Layout constants — keep in sync with resource-week-view
const LABEL_COL_WIDTH = 196   // px, left station label column
const COMPACT_ROW_HEIGHT = 48 // px when station has no bookings today
const ROW_HEIGHT = 76         // px for single-booking stations
const MULTI_ROW_HEIGHT = 96   // px for General/Prep stations (concurrent bookings)
const BAR_HEIGHT = 38         // px booking bar height
const BAR_GAP = 6             // px gap between stacked bars
const MIN_BAR_WIDTH_PX = 20   // minimum clickable bar width

// Hours shown as tick marks on the time axis
const TIME_TICKS = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22]

interface ResourceDayViewProps {
  bookings: Booking[]
  stations: Station[]
  selectedStations: number[]
  currentUserId: string | null
  currentDate: Date
  onSlotSelect: (start: Date, end: Date, stationId: number) => void
  onEventClick: (booking: Booking, station: Station, rect: DOMRect) => void
}

function getMinutesFromMidnight(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function formatHour(h: number): string {
  return new Date(2000, 0, 1, h).toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
  })
}

/** Stack overlapping bookings vertically within a row. Returns top offset per booking. */
function stackBookings(bookings: Booking[]): Map<string, number> {
  const sorted = [...bookings].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
  const lanes: number[] = []
  const offsets = new Map<string, number>()

  for (const b of sorted) {
    const start = new Date(b.start_time).getTime()
    const end = new Date(b.end_time).getTime()
    let lane = lanes.findIndex((laneEnd) => laneEnd <= start)
    if (lane === -1) {
      lane = lanes.length
      lanes.push(end)
    } else {
      lanes[lane] = end
    }
    offsets.set(b.id, lane * (BAR_HEIGHT + BAR_GAP))
  }
  return offsets
}

export function ResourceDayView({
  bookings,
  stations,
  selectedStations,
  currentUserId,
  currentDate,
  onSlotSelect,
  onEventClick,
}: ResourceDayViewProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const [nowMinutes, setNowMinutes] = useState(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const isToday = isSameDay(currentDate, new Date())
    if (!isToday) return
    const interval = setInterval(() => {
      const n = new Date()
      setNowMinutes(n.getHours() * 60 + n.getMinutes())
    }, 60_000)
    return () => clearInterval(interval)
  }, [currentDate])

  const visibleStations =
    selectedStations.length > 0
      ? stations.filter((s) => selectedStations.includes(s.id))
      : stations

  const isToday = isSameDay(currentDate, new Date())

  const nowPct =
    isToday && nowMinutes >= HOUR_START * 60 && nowMinutes <= HOUR_END * 60
      ? ((nowMinutes - HOUR_START * 60) / DAY_MINUTES) * 100
      : null

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, station: Station, rowWidth: number) => {
      if ((e.target as HTMLElement).closest('[data-bar]')) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const clickedMinute = Math.floor((x / rowWidth) * DAY_MINUTES)
      const snappedMinute = Math.floor(clickedMinute / 30) * 30
      const totalMinute = HOUR_START * 60 + Math.max(0, Math.min(DAY_MINUTES - 60, snappedMinute))

      const start = new Date(currentDate)
      start.setHours(Math.floor(totalMinute / 60), totalMinute % 60, 0, 0)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + 60)
      onSlotSelect(start, end, station.id)
    },
    [currentDate, onSlotSelect]
  )

  // ─── Mobile: accordion list ───────────────────────────────────────────────
  if (isMobile) {
    const singleStation = selectedStations.length === 1
    return (
      <div className="resource-day-view-mobile space-y-3 max-h-[80vh] overflow-y-auto">
        {visibleStations.map((station) => {
          const hex = getStationHex(station.name)
          const stationBookings = bookings
            .filter((b) => b.station_id === station.id)
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
          const isExpanded = singleStation || expandedSections.has(station.id)

          return (
            <div key={station.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => {
                  if (singleStation) return
                  setExpandedSections((prev) => {
                    const next = new Set(prev)
                    if (next.has(station.id)) next.delete(station.id)
                    else next.add(station.id)
                    return next
                  })
                }}
                className="w-full flex items-center gap-3 px-4 py-4 bg-white hover:bg-slate-50 transition-colors"
                style={{ borderLeft: `4px solid ${hex}` }}
              >
                <div className="flex-1 text-left min-w-0">
                  <span className="font-bold text-base text-slate-800 block leading-tight">{station.name}</span>
                  {station.equipment && (
                    <span className="text-xs text-slate-600 block leading-tight mt-0.5">
                      {station.equipment}
                    </span>
                  )}
                </div>
                <span
                  className="text-xs font-semibold rounded-full px-2.5 py-1 flex-shrink-0"
                  style={
                    stationBookings.length > 0
                      ? { backgroundColor: hex + '20', color: hex }
                      : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                  }
                >
                  {stationBookings.length === 0
                    ? 'Open'
                    : `${stationBookings.length} booking${stationBookings.length > 1 ? 's' : ''}`}
                </span>
                {!singleStation && (
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>

              {isExpanded && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {stationBookings.length === 0 ? (
                    <div
                      className="px-4 py-8 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => {
                        const start = new Date(currentDate)
                        start.setHours(9, 0, 0, 0)
                        const end = new Date(start)
                        end.setHours(10, 0, 0, 0)
                        onSlotSelect(start, end, station.id)
                      }}
                    >
                      <p className="text-sm font-medium text-slate-400">Available all day</p>
                      <p className="text-xs text-slate-300 mt-1">Tap to book</p>
                    </div>
                  ) : (
                    stationBookings.map((booking) => {
                      const isOwn = currentUserId && booking.user_id === currentUserId
                      return (
                        <div
                          key={booking.id}
                          className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors ${isOwn ? 'bg-slate-900/[0.02]' : ''}`}
                          style={{ borderLeft: `3px solid ${hex}` }}
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            onEventClick(booking, station, rect)
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {isOwn ? '★ ' : ''}{booking.profile?.company_name || 'Reserved'}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">
                              {formatTimePST(booking.start_time)} – {formatTimePST(booking.end_time)}
                            </p>
                          </div>
                          <div className="text-xs text-slate-500 font-semibold bg-slate-100 rounded-full px-2.5 py-1 flex-shrink-0">
                            {durationLabel(booking.start_time, booking.end_time)}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ─── Desktop: horizontal resource timeline ────────────────────────────────
  return (
    <div className="resource-day-view border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col">

      {/* Time axis header */}
      <div className="flex flex-shrink-0 border-b border-slate-200 bg-slate-50" style={{ paddingLeft: LABEL_COL_WIDTH }}>
        <div className="flex-1 relative h-9">
          {TIME_TICKS.map((h) => {
            const pct = ((h - HOUR_START) / (HOUR_END - HOUR_START)) * 100
            return (
              <div
                key={h}
                className="absolute flex flex-col items-center"
                style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
              >
                <span className="text-xs text-slate-400 font-medium leading-9">
                  {h === HOUR_END ? '' : formatHour(h)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Station rows */}
      <div className="flex flex-col divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: '72vh' }}>
        {visibleStations.map((station) => {
          const hex = getStationHex(station.name)
          const isMulti = station.category === 'General'
          const stationBookings = bookings
            .filter((b) => b.station_id === station.id)
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
          // Compact when empty, taller when concurrent bookings exist
          const hasMultiple = stationBookings.length >= 2
          const rowHeight = stationBookings.length === 0 ? COMPACT_ROW_HEIGHT
            : hasMultiple ? MULTI_ROW_HEIGHT
            : ROW_HEIGHT
          // Always stack when multiple bookings exist (not just General stations)
          const stackOffsets = hasMultiple ? stackBookings(stationBookings) : null

          return (
            <div key={station.id} className="flex" style={{ minHeight: rowHeight }}>

              {/* Station label */}
              <div
                className="flex-shrink-0 flex items-center px-4 bg-white border-r border-slate-200"
                style={{ width: LABEL_COL_WIDTH, borderLeft: `4px solid ${hex}` }}
              >
                <div className="min-w-0 w-full">
                  <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                    {station.name}
                  </p>
                  {station.equipment && (
                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                      {station.equipment}
                    </p>
                  )}
                  <span
                    className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                    style={
                      stationBookings.length > 0
                        ? { backgroundColor: hex + '18', color: hex }
                        : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                    }
                  >
                    {stationBookings.length === 0
                      ? 'Open'
                      : `${stationBookings.length} booking${stationBookings.length > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {/* Timeline row */}
              <RowTimeline
                station={station}
                stationBookings={stationBookings}
                stackOffsets={stackOffsets}
                rowHeight={rowHeight}
                hex={hex}
                nowPct={nowPct}
                currentUserId={currentUserId}
                currentDate={currentDate}
                onRowClick={handleRowClick}
                onEventClick={onEventClick}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── RowTimeline ──────────────────────────────────────────────────────────────

interface RowTimelineProps {
  station: Station
  stationBookings: Booking[]
  stackOffsets: Map<string, number> | null
  rowHeight: number
  hex: string
  nowPct: number | null
  currentUserId: string | null
  currentDate: Date
  onRowClick: (e: React.MouseEvent<HTMLDivElement>, station: Station, width: number) => void
  onEventClick: (booking: Booking, station: Station, rect: DOMRect) => void
}

function RowTimeline({
  station,
  stationBookings,
  stackOffsets,
  rowHeight,
  hex,
  nowPct,
  currentUserId,
  currentDate,
  onRowClick,
  onEventClick,
}: RowTimelineProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={rowRef}
      className="group flex-1 relative cursor-pointer transition-colors overflow-hidden hover:bg-slate-50/50"
      style={{ height: rowHeight }}
      onClick={(e) => {
        if (!rowRef.current) return
        onRowClick(e, station, rowRef.current.getBoundingClientRect().width)
      }}
    >
      {/* Hourly vertical grid lines */}
      {TIME_TICKS.map((h) => {
        const pct = ((h - HOUR_START) / (HOUR_END - HOUR_START)) * 100
        return (
          <div
            key={h}
            className="absolute top-0 bottom-0 border-l border-slate-100 pointer-events-none"
            style={{ left: `${pct}%` }}
          />
        )
      })}

      {/* Now indicator — vertical red line */}
      {nowPct !== null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10 pointer-events-none"
          style={{ left: `${nowPct}%` }}
        />
      )}

      {/* Booking bars */}
      {stationBookings.map((booking) => {
        const startMin = getMinutesFromMidnight(booking.start_time)
        let endMin = getMinutesFromMidnight(booking.end_time)
        // Overnight booking: end time is on the next calendar day (endMin < startMin)
        // Clamp to HOUR_END so the bar renders to the right edge of the visible window
        if (endMin < startMin) endMin = HOUR_END * 60
        const clampedStart = Math.max(startMin, HOUR_START * 60)
        const clampedEnd = Math.min(endMin, HOUR_END * 60)
        const leftPct = ((clampedStart - HOUR_START * 60) / DAY_MINUTES) * 100
        const widthPct = Math.max(((clampedEnd - clampedStart) / DAY_MINUTES) * 100, 0.5)
        const topOffset = stackOffsets ? (stackOffsets.get(booking.id) ?? 0) : 0
        const isOwn = currentUserId && booking.user_id === currentUserId
        const label = booking.profile?.company_name || 'Reserved'
        // 1hr booking = ~5.6% of 18hr timeline — show inline only when bar is wide enough
        const showInline = widthPct > 10
        const showName = widthPct > 20

        return (
          <div
            key={booking.id}
            data-bar
            // overflow-visible so the external label can escape the bar bounds
            className={`absolute rounded-md cursor-pointer transition-all hover:brightness-90 hover:shadow-md ${isOwn ? 'ring-2 ring-slate-900/30 ring-offset-1' : ''}`}
            style={{
              left: `${leftPct}%`,
              width: `${widthPct}%`,
              minWidth: MIN_BAR_WIDTH_PX,
              top: topOffset + 5,
              height: BAR_HEIGHT,
              backgroundColor: hex,
            }}
            onClick={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              onEventClick(booking, station, rect)
            }}
            title={`${isOwn ? '★ ' : ''}${formatTimePST(booking.start_time)} – ${formatTimePST(booking.end_time)} · ${label} (${durationLabel(booking.start_time, booking.end_time)})`}
          >
            {showInline ? (
              <div className="flex items-center h-full px-2 gap-1.5 overflow-hidden">
                {isOwn && <span className="text-white text-xs flex-shrink-0">★</span>}
                <span className="text-white text-xs font-semibold truncate leading-none flex-shrink-0">
                  {formatTimePST(booking.start_time)}
                </span>
                {showName && (
                  <span className="text-white/80 text-[11px] truncate leading-none">
                    {label}
                  </span>
                )}
              </div>
            ) : (
              /* External label — floats to the right of narrow bars */
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 pointer-events-none z-20 whitespace-nowrap">
                <span className="text-[11px] text-slate-700 font-semibold bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm leading-none">
                  {isOwn && '★ '}{formatTimePST(booking.start_time)}–{formatTimePST(booking.end_time)}
                  <span className="text-slate-400 font-normal"> · {label}</span>
                </span>
              </div>
            )}
          </div>
        )
      })}

      {/* "Book" on hover — every row is bookable at some time slot */}
      <div className="absolute bottom-1.5 right-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md leading-none">
          + Book
        </span>
      </div>
    </div>
  )
}
