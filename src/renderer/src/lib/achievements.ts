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
  { id: 'first_call', name: 'First Dial', description: 'Make your first phone call', icon: '\u260E', category: 'calls', requirement: 1, field: 'total_calls' },
  { id: 'calls_10', name: 'Phone Warrior', description: 'Make 10 phone calls', icon: '\uD83D\uDCDE', category: 'calls', requirement: 10, field: 'total_calls' },
  { id: 'calls_50', name: 'Dialing Machine', description: 'Make 50 phone calls', icon: '\uD83D\uDD25', category: 'calls', requirement: 50, field: 'total_calls' },
  { id: 'calls_100', name: 'The Closer', description: 'Make 100 phone calls', icon: '\uD83C\uDFC6', category: 'calls', requirement: 100, field: 'total_calls' },
  { id: 'first_email', name: 'First Outreach', description: 'Send your first email', icon: '\u2709', category: 'emails', requirement: 1, field: 'total_emails' },
  { id: 'emails_25', name: 'Inbox Slayer', description: 'Send 25 emails', icon: '\uD83D\uDCE7', category: 'emails', requirement: 25, field: 'total_emails' },
  { id: 'emails_100', name: 'Email Mogul', description: 'Send 100 emails', icon: '\uD83D\uDCEC', category: 'emails', requirement: 100, field: 'total_emails' },
  { id: 'first_deal', name: 'First Blood', description: 'Close your first deal', icon: '\uD83D\uDCB0', category: 'deals', requirement: 1, field: 'total_deals' },
  { id: 'deals_5', name: 'Deal Maker', description: 'Close 5 deals', icon: '\uD83D\uDCB5', category: 'deals', requirement: 5, field: 'total_deals' },
  { id: 'deals_25', name: 'Money Machine', description: 'Close 25 deals', icon: '\uD83D\uDCB8', category: 'deals', requirement: 25, field: 'total_deals' },
  { id: 'streak_3', name: 'On Fire', description: '3 day activity streak', icon: '\uD83D\uDD25', category: 'streak', requirement: 3, field: 'streak_days' },
  { id: 'streak_7', name: 'Week Warrior', description: '7 day activity streak', icon: '\u26A1', category: 'streak', requirement: 7, field: 'streak_days' },
  { id: 'streak_30', name: 'Unstoppable', description: '30 day activity streak', icon: '\uD83D\uDCAA', category: 'streak', requirement: 30, field: 'streak_days' },
  { id: 'first_meeting', name: 'Face Time', description: 'Log your first meeting', icon: '\uD83E\uDD1D', category: 'meetings', requirement: 1, field: 'total_meetings' },
  { id: 'meetings_10', name: 'Networking Pro', description: 'Log 10 meetings', icon: '\uD83C\uDF10', category: 'meetings', requirement: 10, field: 'total_meetings' },
  { id: 'leads_10', name: 'Prospector', description: 'Save 10 leads', icon: '\uD83D\uDD0D', category: 'leads', requirement: 10, field: 'total_leads' },
  { id: 'leads_50', name: 'Lead Hunter', description: 'Save 50 leads', icon: '\uD83C\uDFAF', category: 'leads', requirement: 50, field: 'total_leads' }
]
