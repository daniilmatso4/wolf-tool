export interface CallPrepResult {
  opener: string
  talking_points: string[]
  objection_cards: { objection: string; response: string }[]
  why_now: string
  product_fit: string
}

export interface QueuedLead {
  id: string
  name: string
  phone?: string
  address?: string
  types?: string
  status: string
  priority: string
  rating?: number
  rating_count?: number
  has_website: number
  website?: string
  owner_name?: string
  owner_title?: string
  owner_phone?: string
  score: number
  reason: string
  follow_up_due?: boolean
  follow_up_overdue?: boolean
}

export interface CallSession {
  id: string
  started_at: string
  ended_at?: string
  mode: 'normal' | 'power_hour'
  calls_made: number
  calls_answered: number
  meetings_booked: number
  total_duration_seconds: number
  xp_earned: number
}

export type CallOutcome = 'positive' | 'no_answer' | 'not_interested' | 'meeting_booked'
