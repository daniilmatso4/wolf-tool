export interface UserProfile {
  id: number
  username: string
  xp: number
  level: number
  streak_days: number
  last_activity_date?: string
  total_calls: number
  total_emails: number
  total_meetings: number
  total_deals: number
  total_leads: number
  total_revenue?: number
  power_hours_completed?: number
  longest_streak?: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'calls' | 'emails' | 'deals' | 'streak' | 'leads' | 'meetings' | 'misc'
  requirement: number
  unlocked: boolean
  unlocked_at?: string
  progress: number
}

export interface DailyStats {
  date: string
  calls: number
  emails: number
  meetings: number
  deals: number
  xp_earned: number
}

export interface Level {
  level: number
  title: string
  xp_required: number
}
