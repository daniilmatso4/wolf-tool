import { getDB } from '../database/connection'
import { productRepo } from '../database/repositories/product'

interface ScoredLead {
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

function queryAll(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const db = getDB()
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows: Record<string, unknown>[] = []
  while (stmt.step()) {
    const values = stmt.get()
    const columns = stmt.getColumnNames()
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => { obj[col] = values[i] })
    rows.push(obj)
  }
  stmt.free()
  return rows
}

export function getCallQueue(limit: number = 20): ScoredLead[] {
  // Get all actionable leads
  const leads = queryAll(
    `SELECT * FROM leads WHERE status NOT IN ('client', 'not_interested') ORDER BY updated_at DESC`
  )

  // Get follow-up data
  const today = new Date().toISOString().split('T')[0]
  const followUps = queryAll(
    `SELECT lead_id, due_date FROM follow_ups WHERE completed = 0 AND skipped = 0`
  )
  const followUpMap = new Map<string, { due: boolean; overdue: boolean }>()
  for (const fu of followUps) {
    const dueDate = fu.due_date as string
    const isOverdue = dueDate < today
    const isDue = dueDate <= today
    const existing = followUpMap.get(fu.lead_id as string)
    followUpMap.set(fu.lead_id as string, {
      due: isDue || (existing?.due ?? false),
      overdue: isOverdue || (existing?.overdue ?? false)
    })
  }

  // Get product target industries for product fit scoring
  const myProduct = productRepo.get()
  let targetIndustries: string[] = []
  if (myProduct && myProduct.target_industries) {
    targetIndustries = JSON.parse((myProduct.target_industries as string) || '[]').map((i: string) => i.toLowerCase())
  }

  const scored: ScoredLead[] = leads.map((lead) => {
    let score = 0
    let reason = ''

    // Priority scoring
    if (lead.priority === 'high') { score += 30; reason = 'High priority' }
    else if (lead.priority === 'medium') score += 15

    // No website = target
    if (!lead.has_website) { score += 20; reason = reason || 'No website - perfect target' }

    // Status scoring
    if (lead.status === 'interested') { score += 25; reason = reason || 'Interested - close the deal' }
    else if (lead.status === 'contacted') { score += 15; reason = reason || 'Follow up' }
    else if (lead.status === 'new') { score += 10; reason = reason || 'New lead - first contact' }

    // Rating scoring
    if ((lead.rating as number) >= 4.0) score += 10
    if ((lead.rating_count as number) >= 50) score += 5

    // Staleness scoring
    const daysSinceUpdate = Math.floor((Date.now() - new Date(lead.updated_at as string).getTime()) / 86400000)
    if (lead.status === 'contacted' && daysSinceUpdate >= 3) {
      score += 15
      reason = `Follow up - ${daysSinceUpdate} days since contact`
    }
    if (lead.status === 'interested' && daysSinceUpdate >= 2) {
      score += 20
      reason = `Hot lead going cold - ${daysSinceUpdate} days idle`
    }

    // Follow-up scoring
    const fu = followUpMap.get(lead.id as string)
    let followUpDue = false
    let followUpOverdue = false
    if (fu) {
      if (fu.overdue) {
        score += 30
        reason = 'Overdue follow-up!'
        followUpOverdue = true
      } else if (fu.due) {
        score += 20
        reason = 'Follow-up due today'
        followUpDue = true
      }
    }

    // Product fit scoring
    if (targetIndustries.length > 0 && lead.types) {
      const leadTypes = (lead.types as string).toLowerCase()
      const match = targetIndustries.some((ind) => leadTypes.includes(ind))
      if (match) {
        score += 15
        reason = reason || 'Industry match for your product'
      }
    }

    // Has phone = can actually call
    if (lead.phone) score += 5

    return {
      id: lead.id as string,
      name: lead.name as string,
      phone: lead.phone as string | undefined,
      address: lead.address as string | undefined,
      types: lead.types as string | undefined,
      status: lead.status as string,
      priority: lead.priority as string,
      rating: lead.rating as number | undefined,
      rating_count: lead.rating_count as number | undefined,
      has_website: lead.has_website as number,
      website: lead.website as string | undefined,
      owner_name: lead.owner_name as string | undefined,
      owner_title: lead.owner_title as string | undefined,
      owner_phone: lead.owner_phone as string | undefined,
      score,
      reason: reason || 'Review lead',
      follow_up_due: followUpDue,
      follow_up_overdue: followUpOverdue
    }
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, limit)
}
