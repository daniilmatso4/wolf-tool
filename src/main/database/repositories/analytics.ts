import { getDB } from '../connection'

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

export const analyticsRepo = {
  getVolumeTrends(days: number = 30): Record<string, unknown>[] {
    return queryAll(
      `SELECT date, calls, emails, meetings, deals, xp_earned
       FROM daily_stats
       WHERE date >= date('now', '-' || ? || ' days')
       ORDER BY date ASC`,
      [days]
    )
  },

  getConversionFunnel(): Record<string, unknown> {
    const db = getDB()
    const totalLeads = queryAll('SELECT COUNT(*) as count FROM leads')[0]?.count || 0
    const contacted = queryAll("SELECT COUNT(*) as count FROM leads WHERE status IN ('contacted','interested','client')")[0]?.count || 0
    const interested = queryAll("SELECT COUNT(*) as count FROM leads WHERE status IN ('interested','client')")[0]?.count || 0
    const clients = queryAll("SELECT COUNT(*) as count FROM leads WHERE status = 'client'")[0]?.count || 0
    const totalCalls = queryAll("SELECT COUNT(*) as count FROM activities WHERE type = 'call'")[0]?.count || 0
    const totalMeetings = queryAll("SELECT COUNT(*) as count FROM activities WHERE type = 'meeting'")[0]?.count || 0

    return {
      total_leads: totalLeads,
      contacted,
      interested,
      clients,
      total_calls: totalCalls,
      total_meetings: totalMeetings
    }
  },

  getCallHeatmap(): Record<string, unknown>[] {
    // Returns hourly counts by day of week for calls
    return queryAll(
      `SELECT
         CAST(strftime('%w', created_at) AS INTEGER) as day_of_week,
         CAST(strftime('%H', created_at) AS INTEGER) as hour,
         COUNT(*) as count,
         SUM(CASE WHEN outcome = 'positive' THEN 1 ELSE 0 END) as positive_count
       FROM activities
       WHERE type = 'call'
       GROUP BY day_of_week, hour
       ORDER BY day_of_week, hour`
    )
  },

  getIndustryStats(): Record<string, unknown>[] {
    return queryAll(
      `SELECT
         l.types as industry,
         COUNT(DISTINCT l.id) as lead_count,
         COUNT(CASE WHEN a.type = 'call' THEN 1 END) as calls,
         COUNT(CASE WHEN a.outcome = 'positive' THEN 1 END) as positive_outcomes,
         COUNT(CASE WHEN l.status = 'client' THEN 1 END) as clients
       FROM leads l
       LEFT JOIN activities a ON a.lead_id = l.id
       WHERE l.types IS NOT NULL AND l.types != ''
       GROUP BY l.types
       ORDER BY positive_outcomes DESC
       LIMIT 15`
    )
  },

  getRevenueData(): Record<string, unknown>[] {
    return queryAll(
      `SELECT
         substr(a.created_at, 1, 7) as month,
         SUM(COALESCE(a.deal_value, 0)) as revenue,
         COUNT(*) as deal_count
       FROM activities a
       WHERE a.type = 'deal_closed' AND a.deal_value > 0
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`
    )
  }
}
