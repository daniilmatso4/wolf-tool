import { getDB, saveDB } from '../connection'

export interface UserProfileRow {
  id: number
  username: string
  xp: number
  level: number
  streak_days: number
  last_activity_date?: string
  total_calls: number
  total_emails: number
  total_meetings: number
  total_deals: number
  total_leads: number
}

export interface AchievementRow {
  id: string
  name: string
  description?: string
  icon?: string
  category?: string
  requirement: number
  unlocked: number
  unlocked_at?: string
  progress: number
}

export interface DailyStatsRow {
  date: string
  calls: number
  emails: number
  meetings: number
  deals: number
  xp_earned: number
}

function stmtToObj(stmt: any): Record<string, unknown> {
  const values = stmt.get()
  const columns = stmt.getColumnNames()
  const obj: Record<string, unknown> = {}
  columns.forEach((col: string, i: number) => { obj[col] = values[i] })
  return obj
}

function queryAll<T>(sql: string, params: unknown[] = []): T[] {
  const db = getDB()
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params)
  const rows: T[] = []
  while (stmt.step()) {
    rows.push(stmtToObj(stmt) as T)
  }
  stmt.free()
  return rows
}

function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  return queryAll<T>(sql, params)[0]
}

export const gamificationRepo = {
  getProfile(): UserProfileRow {
    return queryOne<UserProfileRow>('SELECT * FROM user_profile WHERE id = 1')!
  },

  updateProfile(fields: Record<string, unknown>): UserProfileRow {
    const db = getDB()
    const sets: string[] = []
    const values: unknown[] = []

    for (const [key, val] of Object.entries(fields)) {
      if (key !== 'id') {
        sets.push(`${key} = ?`)
        values.push(val)
      }
    }

    if (sets.length > 0) {
      db.run(`UPDATE user_profile SET ${sets.join(', ')} WHERE id = 1`, values)
      saveDB()
    }
    return this.getProfile()
  },

  addXP(amount: number): UserProfileRow {
    const db = getDB()
    db.run('UPDATE user_profile SET xp = xp + ? WHERE id = 1', [amount])
    saveDB()
    return this.getProfile()
  },

  incrementStat(field: string): void {
    const allowedFields = ['total_calls', 'total_emails', 'total_meetings', 'total_deals', 'total_leads']
    if (!allowedFields.includes(field)) return
    const db = getDB()
    db.run(`UPDATE user_profile SET ${field} = ${field} + 1 WHERE id = 1`)
    saveDB()
  },

  getAchievements(): AchievementRow[] {
    return queryAll<AchievementRow>('SELECT * FROM achievements ORDER BY category, requirement')
  },

  upsertAchievement(a: Record<string, unknown>): void {
    const db = getDB()
    db.run(
      `INSERT INTO achievements (id, name, description, icon, category, requirement, unlocked, unlocked_at, progress)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET unlocked=?, unlocked_at=?, progress=?`,
      [a.id, a.name, a.description, a.icon, a.category, a.requirement, a.unlocked, a.unlocked_at, a.progress,
       a.unlocked, a.unlocked_at, a.progress] as unknown[]
    )
    saveDB()
  },

  getDailyStats(date: string): DailyStatsRow | undefined {
    return queryOne<DailyStatsRow>('SELECT * FROM daily_stats WHERE date = ?', [date])
  },

  upsertDailyStats(date: string, field: string, amount: number): void {
    const db = getDB()
    const existing = this.getDailyStats(date)
    const allowedFields = ['calls', 'emails', 'meetings', 'deals', 'xp_earned']
    if (!allowedFields.includes(field)) return

    if (!existing) {
      const row: Record<string, unknown> = { date, calls: 0, emails: 0, meetings: 0, deals: 0, xp_earned: 0 }
      row[field] = amount
      db.run(
        `INSERT INTO daily_stats (date, calls, emails, meetings, deals, xp_earned)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [row.date, row.calls, row.emails, row.meetings, row.deals, row.xp_earned] as unknown[]
      )
    } else {
      db.run(`UPDATE daily_stats SET ${field} = ${field} + ? WHERE date = ?`, [amount, date])
    }
    saveDB()
  },

  getRecentDailyStats(days = 30): DailyStatsRow[] {
    return queryAll<DailyStatsRow>(
      `SELECT * FROM daily_stats WHERE date >= date('now', '-' || ? || ' days') ORDER BY date DESC`,
      [days]
    )
  },

  updateStreak(): { streak_days: number; streak_updated: boolean } {
    const db = getDB()
    const profile = this.getProfile()
    const today = new Date().toISOString().split('T')[0]

    if (profile.last_activity_date === today) {
      return { streak_days: profile.streak_days, streak_updated: false }
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    let newStreak: number

    if (profile.last_activity_date === yesterday) {
      newStreak = profile.streak_days + 1
    } else {
      newStreak = 1
    }

    db.run('UPDATE user_profile SET streak_days = ?, last_activity_date = ? WHERE id = 1', [newStreak, today])
    saveDB()
    return { streak_days: newStreak, streak_updated: true }
  }
}
