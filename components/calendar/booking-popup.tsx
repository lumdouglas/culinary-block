"use client"

import { Station, Booking } from '@/app/actions/bookings'
import { formatTimePST, formatLongDatePST, formatDayPST, durationLabel } from '@/utils/timezone'
import { getStationHex } from '@/lib/station-colors'
import { X, Clock, MapPin, User, FileText } from 'lucide-react'

export interface PopupState {
  booking: Booking
  station: Station | undefined
  x: number
  y: number
}

export function BookingPopup({
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
  const color = getStationHex(station?.name || '')

  const popupWidth = 288
  const clampedX = Math.min(Math.max(x - popupWidth / 2, 12), window.innerWidth - popupWidth - 12)
  const clampedY = Math.min(y, window.innerHeight - 320)

  return (
    <div
      id="booking-popup"
      className="fixed z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{ left: clampedX, top: clampedY }}
    >
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

      <div className="p-4 space-y-3">
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
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="font-medium">
              {isOwn ? 'You' : (booking.profile?.company_name || 'Reserved')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <div className="w-4 flex justify-center">
              <span className="text-xs font-bold text-slate-400">{formatDayPST(booking.start_time)}</span>
            </div>
            <span>{formatLongDatePST(booking.start_time)}</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>
              {formatTimePST(booking.start_time)} – {formatTimePST(booking.end_time)}
              <span className="text-slate-400 ml-1">({duration})</span>
            </span>
          </div>

          {booking.notes && (
            <div className="flex items-start gap-2 text-slate-600">
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-500 italic">{booking.notes}</span>
            </div>
          )}

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
