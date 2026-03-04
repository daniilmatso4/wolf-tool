export interface CadenceStep {
  day: number
  type: 'call' | 'email' | 'linkedin'
  note: string
}

export interface CadenceTemplate {
  id: string
  name: string
  description: string
  steps: CadenceStep[]
  created_at: string
}

export interface FollowUp {
  id: string
  lead_id: string
  cadence_id?: string
  step_index: number
  type: 'call' | 'email' | 'linkedin'
  due_date: string
  completed: boolean
  skipped: boolean
  completed_at?: string
  notes?: string
  created_at: string
  // Joined fields
  lead_name?: string
  lead_phone?: string
  lead_status?: string
}
