import { getDB, saveDB } from '../connection'

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

function queryOne(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  return queryAll(sql, params)[0]
}

export const sentOutreachRepo = {
  create(outreach: {
    id: string
    session_id?: string
    agent_id: string
    prospect_name: string
    prospect_title?: string
    prospect_company?: string
    prospect_profile_url: string
    message: string
  }): void {
    const db = getDB()
    db.run(
      `INSERT INTO sent_outreach (id, session_id, agent_id, prospect_name, prospect_title, prospect_company, prospect_profile_url, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [outreach.id, outreach.session_id || null, outreach.agent_id, outreach.prospect_name,
       outreach.prospect_title || null, outreach.prospect_company || null,
       outreach.prospect_profile_url, outreach.message]
    )
    saveDB()
  },

  getAll(): Record<string, unknown>[] {
    return queryAll('SELECT * FROM sent_outreach ORDER BY sent_at DESC')
  },

  getUnread(): Record<string, unknown>[] {
    return queryAll('SELECT * FROM sent_outreach WHERE response_detected = 1 AND read = 0 ORDER BY response_detected_at DESC')
  },

  getWithResponses(): Record<string, unknown>[] {
    return queryAll('SELECT * FROM sent_outreach WHERE response_detected = 1 ORDER BY response_detected_at DESC')
  },

  getPending(): Record<string, unknown>[] {
    return queryAll('SELECT * FROM sent_outreach WHERE response_detected = 0 ORDER BY sent_at DESC')
  },

  markResponseDetected(id: string, snippet: string): void {
    const db = getDB()
    db.run(
      "UPDATE sent_outreach SET response_detected = 1, response_snippet = ?, response_detected_at = datetime('now') WHERE id = ?",
      [snippet, id]
    )
    saveDB()
  },

  markRead(id: string): void {
    getDB().run('UPDATE sent_outreach SET read = 1 WHERE id = ?', [id])
    saveDB()
  },

  markAllRead(): void {
    getDB().run('UPDATE sent_outreach SET read = 1 WHERE response_detected = 1 AND read = 0')
    saveDB()
  },

  getByProfileUrl(url: string): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM sent_outreach WHERE prospect_profile_url = ?', [url])
  },

  getStats(): { total_sent: number; responses: number; pending: number; response_rate: number } {
    const db = getDB()
    const total = queryOne('SELECT COUNT(*) as count FROM sent_outreach') as any
    const responses = queryOne('SELECT COUNT(*) as count FROM sent_outreach WHERE response_detected = 1') as any
    const totalSent = total?.count || 0
    const totalResponses = responses?.count || 0
    return {
      total_sent: totalSent,
      responses: totalResponses,
      pending: totalSent - totalResponses,
      response_rate: totalSent > 0 ? Math.round((totalResponses / totalSent) * 100) : 0
    }
  }
}

export const ownerDiscoveryRepo = {
  get(leadId: string): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM owner_discovery WHERE lead_id = ?', [leadId])
  },

  upsert(data: {
    lead_id: string
    owner_name: string | null
    owner_title: string | null
    owner_phone: string | null
    owner_email: string | null
    confidence: string
  }): void {
    const db = getDB()
    db.run(
      `INSERT INTO owner_discovery (lead_id, owner_name, owner_title, owner_phone, owner_email, confidence)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(lead_id) DO UPDATE SET owner_name=?, owner_title=?, owner_phone=?, owner_email=?, confidence=?, discovered_at=datetime('now')`,
      [data.lead_id, data.owner_name, data.owner_title, data.owner_phone, data.owner_email, data.confidence,
       data.owner_name, data.owner_title, data.owner_phone, data.owner_email, data.confidence]
    )
    saveDB()
  },

  delete(leadId: string): void {
    getDB().run('DELETE FROM owner_discovery WHERE lead_id = ?', [leadId])
    saveDB()
  }
}

export const leadIntelRepo = {
  get(leadId: string): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM lead_intel WHERE lead_id = ?', [leadId])
  },

  upsert(intel: {
    lead_id: string
    brief: string
    talking_points: string
    pain_points: string
    suggested_approach: string
    competitive_angle?: string
  }): void {
    const db = getDB()
    db.run(
      `INSERT INTO lead_intel (lead_id, brief, talking_points, pain_points, suggested_approach, competitive_angle)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(lead_id) DO UPDATE SET brief=?, talking_points=?, pain_points=?, suggested_approach=?, competitive_angle=?, generated_at=datetime('now')`,
      [intel.lead_id, intel.brief, intel.talking_points, intel.pain_points, intel.suggested_approach, intel.competitive_angle || null,
       intel.brief, intel.talking_points, intel.pain_points, intel.suggested_approach, intel.competitive_angle || null]
    )
    saveDB()
  },

  delete(leadId: string): void {
    getDB().run('DELETE FROM lead_intel WHERE lead_id = ?', [leadId])
    saveDB()
  }
}
