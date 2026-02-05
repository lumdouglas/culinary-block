export interface Kitchen {
  id: string
  name: string
  description?: string
  hourly_rate: number
  color_code: string
}

export interface Booking {
  id: string
  user_id: string
  kitchen_id: string
  start_time: string
  end_time: string
  rrule?: string
  profiles?: {
    company_name: string
  }
}