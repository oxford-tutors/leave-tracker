export interface Profile {
  id: string
  name: string
  email?: string
  role: 'employee' | 'admin'
  department: string
  active: boolean
  created_at: string
}

export interface Entitlement {
  id: string
  user_id: string
  year: number
  total_days: number
  bank_holidays: number
  carried_over: number
}

export interface LeaveRequest {
  id: string
  user_id: string
  leave_type: string
  start_date: string
  end_date: string
  hours: number
  note: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  responded_at: string | null
  responded_by: string | null
  created_at: string
  profile?: Profile
}
