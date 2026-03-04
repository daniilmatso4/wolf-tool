import { getDB, saveDB } from '../connection'
import { v4 as uuidv4 } from 'uuid'

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

export const followUpsRepo = {
  getDueToday(): Record<string, unknown>[] {
    const today = new Date().toISOString().split('T')[0]
    return queryAll(
      `SELECT f.*, l.name as lead_name, l.phone as lead_phone, l.status as lead_status
       FROM follow_ups f JOIN leads l ON f.lead_id = l.id
       WHERE f.due_date <= ? AND f.completed = 0 AND f.skipped = 0
       ORDER BY f.due_date ASC`,
      [today]
    )
  },

  getOverdue(): Record<string, unknown>[] {
    const today = new Date().toISOString().split('T')[0]
    return queryAll(
      `SELECT f.*, l.name as lead_name, l.phone as lead_phone, l.status as lead_status
       FROM follow_ups f JOIN leads l ON f.lead_id = l.id
       WHERE f.due_date < ? AND f.completed = 0 AND f.skipped = 0
       ORDER BY f.due_date ASC`,
      [today]
    )
  },

  getByLead(leadId: string): Record<string, unknown>[] {
    return queryAll(
      `SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY due_date ASC`,
      [leadId]
    )
  },

  schedule(data: {
    lead_id: string
    cadence_id?: string
    step_index?: number
    type?: string
    due_date: string
    notes?: string
  }): Record<string, unknown> {
    const id = uuidv4()
    const db = getDB()
    db.run(
      `INSERT INTO follow_ups (id, lead_id, cadence_id, step_index, type, due_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.lead_id, data.cadence_id || null, data.step_index || 0, data.type || 'call', data.due_date, data.notes || null]
    )
    saveDB()
    return { id, ...data }
  },

  scheduleFromCadence(leadId: string, cadenceId: string): void {
    const cadence = queryOne('SELECT * FROM cadence_templates WHERE id = ?', [cadenceId])
    if (!cadence) return

    const steps = JSON.parse(cadence.steps as string)
    const today = new Date()
    const db = getDB()

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + step.day)
      const id = uuidv4()
      db.run(
        `INSERT INTO follow_ups (id, lead_id, cadence_id, step_index, type, due_date, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, leadId, cadenceId, i, step.type, dueDate.toISOString().split('T')[0], step.note || null]
      )
    }
    saveDB()
  },

  complete(id: string): void {
    const db = getDB()
    db.run("UPDATE follow_ups SET completed = 1, completed_at = datetime('now') WHERE id = ?", [id])
    saveDB()
  },

  skip(id: string): void {
    const db = getDB()
    db.run('UPDATE follow_ups SET skipped = 1 WHERE id = ?', [id])
    saveDB()
  }
}

export const cadenceRepo = {
  getAll(): Record<string, unknown>[] {
    return queryAll('SELECT * FROM cadence_templates ORDER BY name ASC')
  },

  get(id: string): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM cadence_templates WHERE id = ?', [id])
  },

  save(cadence: { id: string; name: string; description?: string; steps: string }): void {
    const db = getDB()
    db.run(
      `INSERT INTO cadence_templates (id, name, description, steps)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=?, description=?, steps=?`,
      [cadence.id, cadence.name, cadence.description || '', cadence.steps,
       cadence.name, cadence.description || '', cadence.steps]
    )
    saveDB()
  },

  delete(id: string): void {
    getDB().run('DELETE FROM cadence_templates WHERE id = ?', [id])
    saveDB()
  }
}
