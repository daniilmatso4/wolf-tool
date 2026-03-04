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

export const scriptsRepo = {
  getAll(): Record<string, unknown>[] {
    return queryAll('SELECT * FROM call_scripts ORDER BY updated_at DESC')
  },

  save(script: { id?: string; name: string; industry?: string; business_type?: string; script_body: string }): string {
    const id = script.id || uuidv4()
    const db = getDB()
    db.run(
      `INSERT INTO call_scripts (id, name, industry, business_type, script_body)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=?, industry=?, business_type=?, script_body=?, updated_at=datetime('now')`,
      [id, script.name, script.industry || '', script.business_type || '', script.script_body,
       script.name, script.industry || '', script.business_type || '', script.script_body]
    )
    saveDB()
    return id
  },

  delete(id: string): void {
    getDB().run('DELETE FROM call_scripts WHERE id = ?', [id])
    saveDB()
  },

  trackUsage(id: string, success: boolean): void {
    const db = getDB()
    db.run('UPDATE call_scripts SET usage_count = usage_count + 1 WHERE id = ?', [id])
    if (success) {
      db.run('UPDATE call_scripts SET success_count = success_count + 1 WHERE id = ?', [id])
    }
    saveDB()
  }
}

export const objectionRepo = {
  getAll(): Record<string, unknown>[] {
    return queryAll('SELECT * FROM objection_playbook ORDER BY category, created_at DESC')
  },

  save(obj: { id?: string; category: string; objection: string; response: string; source?: string }): string {
    const id = obj.id || uuidv4()
    const db = getDB()
    db.run(
      `INSERT INTO objection_playbook (id, category, objection, response, source)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET category=?, objection=?, response=?`,
      [id, obj.category, obj.objection, obj.response, obj.source || 'manual',
       obj.category, obj.objection, obj.response]
    )
    saveDB()
    return id
  },

  delete(id: string): void {
    getDB().run('DELETE FROM objection_playbook WHERE id = ?', [id])
    saveDB()
  },

  trackUsage(id: string, success: boolean): void {
    const db = getDB()
    db.run('UPDATE objection_playbook SET usage_count = usage_count + 1 WHERE id = ?', [id])
    if (success) {
      db.run('UPDATE objection_playbook SET success_count = success_count + 1 WHERE id = ?', [id])
    }
    saveDB()
  }
}
