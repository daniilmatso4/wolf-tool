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

export const emailTemplateRepo = {
  getAll(): Record<string, unknown>[] {
    return queryAll('SELECT * FROM email_templates ORDER BY created_at DESC')
  },

  save(template: { id?: string; name: string; scenario: string; subject_line?: string; body: string }): string {
    const id = template.id || uuidv4()
    const db = getDB()
    db.run(
      `INSERT INTO email_templates (id, name, scenario, subject_line, body)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=?, scenario=?, subject_line=?, body=?`,
      [id, template.name, template.scenario, template.subject_line || '', template.body,
       template.name, template.scenario, template.subject_line || '', template.body]
    )
    saveDB()
    return id
  },

  delete(id: string): void {
    getDB().run('DELETE FROM email_templates WHERE id = ?', [id])
    saveDB()
  }
}

export const sentEmailRepo = {
  log(data: { lead_id: string; template_id?: string; subject: string; body: string; scenario: string }): string {
    const id = uuidv4()
    const db = getDB()
    db.run(
      `INSERT INTO sent_emails (id, lead_id, template_id, subject, body, scenario) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.lead_id, data.template_id || null, data.subject, data.body, data.scenario]
    )
    saveDB()
    return id
  }
}
