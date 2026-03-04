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

export const callPrepRepo = {
  get(leadId: string): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM call_prep WHERE lead_id = ?', [leadId])
  },

  upsert(data: {
    lead_id: string
    opener: string
    talking_points: string
    objection_cards: string
    why_now: string
    product_fit: string
    product_hash: string
  }): void {
    const db = getDB()
    db.run(
      `INSERT INTO call_prep (lead_id, opener, talking_points, objection_cards, why_now, product_fit, product_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(lead_id) DO UPDATE SET opener=?, talking_points=?, objection_cards=?, why_now=?, product_fit=?, product_hash=?, generated_at=datetime('now')`,
      [data.lead_id, data.opener, data.talking_points, data.objection_cards, data.why_now, data.product_fit, data.product_hash,
       data.opener, data.talking_points, data.objection_cards, data.why_now, data.product_fit, data.product_hash]
    )
    saveDB()
  },

  delete(leadId: string): void {
    getDB().run('DELETE FROM call_prep WHERE lead_id = ?', [leadId])
    saveDB()
  }
}

export const callSessionRepo = {
  create(session: { id: string; mode: string }): void {
    const db = getDB()
    db.run(
      `INSERT INTO call_sessions (id, mode) VALUES (?, ?)`,
      [session.id, session.mode]
    )
    saveDB()
  },

  get(id: string): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM call_sessions WHERE id = ?', [id])
  },

  update(id: string, fields: Record<string, unknown>): void {
    const db = getDB()
    const sets: string[] = []
    const vals: unknown[] = []
    for (const [key, val] of Object.entries(fields)) {
      sets.push(`${key} = ?`)
      vals.push(val)
    }
    if (sets.length > 0) {
      vals.push(id)
      db.run(`UPDATE call_sessions SET ${sets.join(', ')} WHERE id = ?`, vals)
      saveDB()
    }
  },

  end(id: string): void {
    const db = getDB()
    db.run("UPDATE call_sessions SET ended_at = datetime('now') WHERE id = ?", [id])
    saveDB()
  },

  incrementStat(id: string, field: string, amount: number = 1): void {
    const db = getDB()
    db.run(`UPDATE call_sessions SET ${field} = ${field} + ? WHERE id = ?`, [amount, id])
    saveDB()
  }
}
