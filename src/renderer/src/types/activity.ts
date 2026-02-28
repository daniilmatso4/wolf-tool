export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'status_change' | 'deal_closed'
export type ActivityOutcome = 'positive' | 'negative' | 'no_answer' | 'neutral'

export interface Activity {
  id: string
  lead_id: string
  type: ActivityType
  outcome?: ActivityOutcome
  notes?: string
  created_at: string
}
