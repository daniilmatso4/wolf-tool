import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: SqlJsDatabase | null = null
let dbPath: string = ''

export async function initDB(): Promise<SqlJsDatabase> {
  if (db) return db

  // In production, load WASM from extraResources; in dev, let sql.js find it automatically
  const isProd = app.isPackaged
  const initOptions: Record<string, unknown> = {}
  if (isProd) {
    const wasmPath = path.join(process.resourcesPath, 'sql-wasm.wasm')
    if (fs.existsSync(wasmPath)) {
      initOptions.locateFile = () => wasmPath
    }
  }

  const SQL = await initSqlJs(initOptions)
  dbPath = path.join(app.getPath('userData'), 'wolf-tool.db')

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(new Uint8Array(buffer))
  } else {
    db = new SQL.Database()
  }

  return db
}

export function getDB(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDB() first.')
  return db
}

export function saveDB(): void {
  if (db && dbPath) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  }
}

export function closeDB(): void {
  if (db) {
    saveDB()
    db.close()
    db = null
  }
}
