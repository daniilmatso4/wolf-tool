import { getDB, saveDB } from '../connection'

export const settingsRepo = {
  get(key: string): string | undefined {
    const db = getDB()
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?')
    stmt.bind([key])
    if (stmt.step()) {
      const val = stmt.get()[0] as string
      stmt.free()
      return val
    }
    stmt.free()
    return undefined
  },

  set(key: string, value: string): void {
    const db = getDB()
    db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
      [key, value, value]
    )
    saveDB()
  },

  getAll(): Record<string, string> {
    const db = getDB()
    const stmt = db.prepare('SELECT key, value FROM settings')
    const result: Record<string, string> = {}
    while (stmt.step()) {
      const values = stmt.get()
      result[values[0] as string] = values[1] as string
    }
    stmt.free()
    return result
  },

  delete(key: string): void {
    getDB().run('DELETE FROM settings WHERE key = ?', [key])
    saveDB()
  }
}
