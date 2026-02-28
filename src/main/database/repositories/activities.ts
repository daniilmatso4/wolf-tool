import { getDB, saveDB } from '../connection'

export interface ActivityRow {
  id: string
  lead_id: string
  type: string
  outcome?: string
  notes?: string
  created_at: string
  lead_name?: string
}

function queryAll(sql: string, params: unknown[] = []): ActivityRow[] {
  const db = getDB()
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows: ActivityRow[] = []
  while (stmt.step()) {
    const values = stmt.get()
    const columns = stmt.getColumnNames()
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => { obj[col] = values[i] })
    rows.push(obj as unknown as ActivityRow)
  }
  stmt.free()
  return rows
}

export const activitiesRepo = {
  getByLeadId(leadId: string): ActivityRow[] {
    return queryAll('SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC', [leadId])
  },

  getRecent(limit = 20): ActivityRow[] {
    return queryAll(
      `SELECT a.*, l.name as lead_name FROM activities a
       LEFT JOIN leads l ON a.lead_id = l.id
       ORDER BY a.created_at DESC LIMIT ?`,
      [limit]
    )
  },

  create(activity: Record<string, unknown>): ActivityRow {
    const db = getDB()
    db.run(
      `INSERT INTO activities (id, lead_id, type, outcome, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [activity.id, activity.lead_id, activity.type, activity.outcome, activity.notes] as unknown[]
    )
    saveDB()
    const rows = queryAll('SELECT * FROM activities WHERE id = ?', [activity.id as string])
    return rows[0]
  },

  getTodayCounts(): { calls: number; emails: number; meetings: number; deals: number } {
    const db = getDB()
    const stmt = db.prepare(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'call' THEN 1 ELSE 0 END), 0) as calls,
        COALESCE(SUM(CASE WHEN type = 'email' THEN 1 ELSE 0 END), 0) as emails,
        COALESCE(SUM(CASE WHEN type = 'meeting' THEN 1 ELSE 0 END), 0) as meetings,
        COALESCE(SUM(CASE WHEN type = 'deal_closed' THEN 1 ELSE 0 END), 0) as deals
      FROM activities WHERE date(created_at) = date('now')`
    )
    stmt.step()
    const values = stmt.get()
    stmt.free()
    return {
      calls: (values[0] as number) || 0,
      emails: (values[1] as number) || 0,
      meetings: (values[2] as number) || 0,
      deals: (values[3] as number) || 0
    }
  }
}
