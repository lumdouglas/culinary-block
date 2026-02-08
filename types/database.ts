export interface Profile {
  id: string
  email: string
  company_name: string
  phone?: string
  kiosk_pin_hash?: string
  role: 'tenant' | 'admin'
  created_at: string
  updated_at: string
}

export interface Kitchen {
  id: string
  name: string
  description?: string
  hourly_rate: number
  color_code: string
  is_active?: boolean
  created_at?: string
}

export interface Application {
  id: string
  email: string
  company_name: string
  phone?: string
  address?: string
  contact_first_name?: string
  contact_last_name?: string
  website?: string
  years_in_operation?: string
  social_media?: string
  cuisine_type?: string
  kitchen_use_description?: string
  usage_hours?: string
  equipment_needed?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface Booking {
  id: string
  user_id: string
  kitchen_id: string
  start_time: string
  end_time: string
  rrule?: string
  created_at?: string
  updated_at?: string
  profiles?: {
    company_name: string
  }
}

export interface Timesheet {
  id: string
  user_id: string
  kitchen_id?: string
  clock_in: string
  clock_out: string | null
  duration_minutes: number | null
  notes?: string
  created_at?: string
}