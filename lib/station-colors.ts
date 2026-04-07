export interface StationColor {
  hex: string
  bg: string
  text: string
}

const DEFAULT_COLOR: StationColor = {
  hex: '#6b7280',
  bg: 'bg-slate-500',
  text: 'text-slate-500',
}

const STATION_COLORS: Record<string, StationColor> = {
  'Station 1': { hex: '#0d9488', bg: 'bg-teal-600', text: 'text-teal-600' },
  'Station 2': { hex: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600' },
  'Station 3': { hex: '#14b8a6', bg: 'bg-teal-500', text: 'text-teal-500' },
  'Station 4': { hex: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-500' },
  'Oven L': { hex: '#16a34a', bg: 'bg-green-600', text: 'text-green-600' },
  'Oven M': { hex: '#22c55e', bg: 'bg-green-500', text: 'text-green-500' },
  'Oven R': { hex: '#4ade80', bg: 'bg-green-400', text: 'text-green-400' },
  'Prep Kitchen': { hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-500' },
  'Dairy Clean Room': { hex: '#f87171', bg: 'bg-red-400', text: 'text-red-400' },
}

export function getStationColor(name: string): StationColor {
  return STATION_COLORS[name] ?? DEFAULT_COLOR
}

export function getStationHex(name: string): string {
  return (STATION_COLORS[name] ?? DEFAULT_COLOR).hex
}

export function getStationBg(name: string): string {
  return (STATION_COLORS[name] ?? DEFAULT_COLOR).bg
}
