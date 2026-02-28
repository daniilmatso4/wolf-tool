import { ActivityType } from '../types/activity'

export const XP_RULES: Record<ActivityType, number> = {
  call: 10,
  email: 5,
  meeting: 25,
  deal_closed: 100,
  note: 2,
  status_change: 0
}

export const LEAD_SAVE_XP = 3
