import { getDB, saveDB } from '../connection'

export interface LeadRow {
  id: string
  google_place_id?: string
  name: string
  phone?: string
  email?: string
  website?: string
  has_website: number
  address?: string
  lat?: number
  lng?: number
  rating?: number
  rating_count?: number
  types?: string
  status: string
  priority: string
  notes?: string
  owner_name?: string
  owner_title?: string
  owner_phone?: string
  owner_email?: string
  created_at: string
  updated_at: string
}

function rowToObj(columns: string[], values: unknown[]): LeadRow {
  const obj: Record<string, unknown> = {}
  columns.forEach((col, i) => { obj[col] = values[i] })
  return obj as unknown as LeadRow
}

function queryAll(sql: string, params: unknown[] = []): LeadRow[] {
  const db = getDB()
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows: LeadRow[] = []
  while (stmt.step()) {
    const values = stmt.get()
    const columns = stmt.getColumnNames()
    rows.push(rowToObj(columns, values))
  }
  stmt.free()
  return rows
}

function queryOne(sql: string, params: unknown[] = []): LeadRow | undefined {
  const rows = queryAll(sql, params)
  return rows[0]
}

export const leadsRepo = {
  getAll(): LeadRow[] {
    return queryAll('SELECT * FROM leads ORDER BY updated_at DESC')
  },

  getByStatus(status: string): LeadRow[] {
    return queryAll('SELECT * FROM leads WHERE status = ? ORDER BY updated_at DESC', [status])
  },

  getById(id: string): LeadRow | undefined {
    return queryOne('SELECT * FROM leads WHERE id = ?', [id])
  },

  existsByPlaceId(placeId: string): boolean {
    const row = queryOne('SELECT id FROM leads WHERE google_place_id = ?', [placeId])
    return !!row
  },

  create(lead: Record<string, unknown>): LeadRow {
    const db = getDB()
    db.run(
      `INSERT INTO leads (id, google_place_id, name, phone, email, website, has_website, address, lat, lng, rating, rating_count, types, status, priority, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lead.id, lead.google_place_id, lead.name, lead.phone, lead.email, lead.website, lead.has_website, lead.address, lead.lat, lead.lng, lead.rating, lead.rating_count, lead.types, lead.status, lead.priority, lead.notes] as unknown[]
    )
    saveDB()
    return this.getById(lead.id as string)!
  },

  update(id: string, fields: Record<string, unknown>): LeadRow | undefined {
    const db = getDB()
    const sets: string[] = []
    const values: unknown[] = []

    for (const [key, val] of Object.entries(fields)) {
      if (key !== 'id' && key !== 'created_at') {
        sets.push(`${key} = ?`)
        values.push(val)
      }
    }
    sets.push("updated_at = datetime('now')")
    values.push(id)

    if (sets.length > 0) {
      db.run(`UPDATE leads SET ${sets.join(', ')} WHERE id = ?`, values)
      saveDB()
    }
    return this.getById(id)
  },

  delete(id: string): void {
    getDB().run('DELETE FROM leads WHERE id = ?', [id])
    saveDB()
  },

  getCount(): number {
    const db = getDB()
    const stmt = db.prepare('SELECT COUNT(*) as count FROM leads')
    stmt.step()
    const result = stmt.get()[0] as number
    stmt.free()
    return result
  },

  getCountByStatus(): Record<string, number> {
    const db = getDB()
    const stmt = db.prepare('SELECT status, COUNT(*) as count FROM leads GROUP BY status')
    const result: Record<string, number> = {}
    while (stmt.step()) {
      const values = stmt.get()
      result[values[0] as string] = values[1] as number
    }
    stmt.free()
    return result
  }
}
