import { getDB, saveDB } from '../connection'

function queryOne(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  const db = getDB()
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  let row: Record<string, unknown> | undefined
  if (stmt.step()) {
    const values = stmt.get()
    const columns = stmt.getColumnNames()
    row = {}
    columns.forEach((col, i) => { row![col] = values[i] })
  }
  stmt.free()
  return row
}

export const productRepo = {
  get(): Record<string, unknown> | undefined {
    return queryOne('SELECT * FROM my_product WHERE id = 1')
  },

  upsert(data: {
    product_name?: string
    company_name?: string
    product_type?: string
    elevator_pitch?: string
    key_benefits?: string
    target_industries?: string
    target_business_sizes?: string
    price_range?: string
    unique_selling_points?: string
    common_objections?: string
    competitors?: string
    ideal_customer_description?: string
    website?: string
  }): void {
    const db = getDB()
    // Ensure the row exists
    db.run(`INSERT OR IGNORE INTO my_product (id) VALUES (1)`)

    const fields: string[] = []
    const values: unknown[] = []

    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = ?`)
        values.push(val)
      }
    }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')")
      db.run(`UPDATE my_product SET ${fields.join(', ')} WHERE id = 1`, values)
    }
    saveDB()
  },

  isConfigured(): boolean {
    const row = this.get()
    if (!row) return false
    // Consider configured if at least product_name and elevator_pitch are set
    return !!(row.product_name && row.elevator_pitch)
  }
}
