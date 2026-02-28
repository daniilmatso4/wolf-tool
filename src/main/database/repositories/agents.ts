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

export const agentSessionsRepo = {
  create(session: { id: string; target_url: string; brand_analysis?: string }): Record<string, unknown> {
    const db = getDB()
    db.run(
      'INSERT INTO agent_sessions (id, target_url, brand_analysis) VALUES (?, ?, ?)',
      [session.id, session.target_url, session.brand_analysis || null]
    )
    saveDB()
    return this.getById(session.id)!
  },

  getById(id: string): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM agent_sessions WHERE id = ?', [id])
  },

  updateBrandAnalysis(id: string, analysis: string): void {
    getDB().run('UPDATE agent_sessions SET brand_analysis = ? WHERE id = ?', [analysis, id])
    saveDB()
  },

  deactivate(id: string): void {
    getDB().run('UPDATE agent_sessions SET active = 0 WHERE id = ?', [id])
    saveDB()
  },

  getActive(): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM agent_sessions WHERE active = 1 ORDER BY created_at DESC LIMIT 1')
  }
}

export const agentRunsRepo = {
  create(run: {
    id: string; agent_id: string; session_id: string;
    target_url: string; brand_analysis?: string
  }): Record<string, unknown> {
    const db = getDB()
    db.run(
      `INSERT INTO agent_runs (id, agent_id, session_id, target_url, brand_analysis, status)
       VALUES (?, ?, ?, ?, ?, 'idle')`,
      [run.id, run.agent_id, run.session_id, run.target_url, run.brand_analysis || null]
    )
    saveDB()
    return this.getById(run.id)!
  },

  getById(id: string): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM agent_runs WHERE id = ?', [id])
  },

  updateStatus(id: string, status: string): void {
    getDB().run("UPDATE agent_runs SET status = ?, updated_at = datetime('now') WHERE id = ?", [status, id])
    saveDB()
  },

  updateProspect(id: string, prospect: string, message: string): void {
    getDB().run(
      "UPDATE agent_runs SET prospect = ?, crafted_message = ?, status = 'review_required', updated_at = datetime('now') WHERE id = ?",
      [prospect, message, id]
    )
    saveDB()
  },

  updateMessage(id: string, message: string): void {
    getDB().run("UPDATE agent_runs SET crafted_message = ?, updated_at = datetime('now') WHERE id = ?", [message, id])
    saveDB()
  },

  approve(id: string): void {
    getDB().run("UPDATE agent_runs SET approved = 1, updated_at = datetime('now') WHERE id = ?", [id])
    saveDB()
  },

  reject(id: string): void {
    getDB().run("UPDATE agent_runs SET approved = 0, updated_at = datetime('now') WHERE id = ?", [id])
    saveDB()
  },

  markSent(id: string): void {
    getDB().run(
      "UPDATE agent_runs SET message_sent = 1, status = 'idle', updated_at = datetime('now') WHERE id = ?", [id]
    )
    saveDB()
  },

  getBySession(sessionId: string): Record<string, unknown>[] {
    return queryAll('SELECT * FROM agent_runs WHERE session_id = ? ORDER BY created_at DESC', [sessionId])
  },

  getLatestByAgent(agentId: string): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM agent_runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT 1', [agentId])
  }
}

export const linkedinCookiesRepo = {
  get(): { cookies: string; user_agent: string; logged_in_at: string; valid: number } | undefined {
    return queryOne('SELECT * FROM linkedin_cookies WHERE id = 1') as any
  },

  save(cookies: string, userAgent: string): void {
    const db = getDB()
    db.run(
      `INSERT INTO linkedin_cookies (id, cookies, user_agent, logged_in_at, valid)
       VALUES (1, ?, ?, datetime('now'), 1)
       ON CONFLICT(id) DO UPDATE SET cookies = ?, user_agent = ?, logged_in_at = datetime('now'), valid = 1`,
      [cookies, userAgent, cookies, userAgent]
    )
    saveDB()
  },

  invalidate(): void {
    getDB().run('UPDATE linkedin_cookies SET valid = 0 WHERE id = 1')
    saveDB()
  }
}
