export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  category: 'calls' | 'emails' | 'deals' | 'streak' | 'leads' | 'meetings' | 'misc'
  requirement: number
  field: string
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'first_call', name: 'First Dial', description: 'Make your first phone call', icon: 'PhoneCall', category: 'calls', requirement: 1, field: 'total_calls' },
  { id: 'calls_10', name: 'Phone Warrior', description: 'Make 10 phone calls', icon: 'Phone', category: 'calls', requirement: 10, field: 'total_calls' },
  { id: 'calls_50', name: 'Dialing Machine', description: 'Make 50 phone calls', icon: 'Flame', category: 'calls', requirement: 50, field: 'total_calls' },
  { id: 'calls_100', name: 'The Closer', description: 'Make 100 phone calls', icon: 'Trophy', category: 'calls', requirement: 100, field: 'total_calls' },
  { id: 'first_email', name: 'First Outreach', description: 'Send your first email', icon: 'Mail', category: 'emails', requirement: 1, field: 'total_emails' },
  { id: 'emails_25', name: 'Inbox Slayer', description: 'Send 25 emails', icon: 'Send', category: 'emails', requirement: 25, field: 'total_emails' },
  { id: 'emails_100', name: 'Email Mogul', description: 'Send 100 emails', icon: 'Inbox', category: 'emails', requirement: 100, field: 'total_emails' },
  { id: 'first_deal', name: 'First Blood', description: 'Close your first deal', icon: 'DollarSign', category: 'deals', requirement: 1, field: 'total_deals' },
  { id: 'deals_5', name: 'Deal Maker', description: 'Close 5 deals', icon: 'Banknote', category: 'deals', requirement: 5, field: 'total_deals' },
  { id: 'deals_25', name: 'Money Machine', description: 'Close 25 deals', icon: 'CircleDollarSign', category: 'deals', requirement: 25, field: 'total_deals' },
  { id: 'streak_3', name: 'On Fire', description: '3 day activity streak', icon: 'Flame', category: 'streak', requirement: 3, field: 'streak_days' },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day activity streak', icon: 'Zap', category: 'streak', requirement: 7, field: 'streak_days' },
  { id: 'streak_30', name: 'Unstoppable', description: '30 day activity streak', icon: 'Dumbbell', category: 'streak', requirement: 30, field: 'streak_days' },
  { id: 'first_meeting', name: 'Face Time', description: 'Log your first meeting', icon: 'Handshake', category: 'meetings', requirement: 1, field: 'total_meetings' },
  { id: 'meetings_10', name: 'Networking Pro', description: 'Log 10 meetings', icon: 'Globe', category: 'meetings', requirement: 10, field: 'total_meetings' },
  { id: 'leads_10', name: 'Prospector', description: 'Save 10 leads', icon: 'Search', category: 'leads', requirement: 10, field: 'total_leads' },
  { id: 'leads_50', name: 'Lead Hunter', description: 'Save 50 leads', icon: 'Target', category: 'leads', requirement: 50, field: 'total_leads' },
  // Phase 6: New achievements
  { id: 'calls_500', name: 'Phone Phenom', description: 'Make 500 phone calls', icon: 'PhoneCall', category: 'calls', requirement: 500, field: 'total_calls' },
  { id: 'power_hours_10', name: 'Machine Mode', description: 'Complete 10 Power Hours', icon: 'Zap', category: 'misc', requirement: 10, field: 'power_hours_completed' },
  { id: 'streak_60', name: 'The Marathon', description: '60 day activity streak', icon: 'Award', category: 'streak', requirement: 60, field: 'streak_days' },
  { id: 'calls_200', name: 'Power Player', description: 'Make 200 phone calls', icon: 'Phone', category: 'calls', requirement: 200, field: 'total_calls' },
  { id: 'deals_50', name: 'Deal Factory', description: 'Close 50 deals', icon: 'Factory', category: 'deals', requirement: 50, field: 'total_deals' },
  { id: 'meetings_25', name: 'Meeting Master', description: 'Log 25 meetings', icon: 'Calendar', category: 'meetings', requirement: 25, field: 'total_meetings' },
  { id: 'leads_100', name: 'Lead Machine', description: 'Save 100 leads', icon: 'Database', category: 'leads', requirement: 100, field: 'total_leads' }
]
