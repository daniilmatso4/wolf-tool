import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getCallQueue } from '../services/call-queue.service'
import { generateCallPrep } from '../services/call-prep.service'
import { callSessionRepo } from '../database/repositories/callmode'
import { getDB, saveDB } from '../database/connection'

function safeHandle(channel: string, handler: (...args: any[]) => any): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return await handler(...args)
    } catch (err) {
      console.error(`[IPC] ${channel} error:`, err)
      throw err
    }
  })
}

function queryOneLead(leadId: string): Record<string, unknown> | null {
  const db = getDB()
  const stmt = db.prepare('SELECT * FROM leads WHERE id = ?')
  stmt.bind([leadId])
  let lead: Record<string, unknown> | null = null
  if (stmt.step()) {
    const values = stmt.get()
    const columns = stmt.getColumnNames()
    lead = {}
    columns.forEach((col: string, i: number) => { lead![col] = values[i] })
  }
  stmt.free()
  return lead
}

export function registerCallModeIPC(): void {
  safeHandle('callmode:getQueue', (limit?: number) => {
    return getCallQueue(limit || 20)
  })

  safeHandle('callmode:getPrep', (leadId: string) => {
    const lead = queryOneLead(leadId)
    if (!lead) throw new Error('Lead not found')
    return generateCallPrep(lead as any)
  })

  safeHandle('callmode:logOutcome', (data: {
    lead_id: string
    session_id: string
    outcome: string
    notes?: string
    follow_up_date?: string
  }) => {
    const db = getDB()

    // Create activity
    const activityId = uuidv4()
    const outcomeMap: Record<string, string> = {
      positive: 'positive',
      no_answer: 'no_answer',
      not_interested: 'negative',
      meeting_booked: 'positive'
    }
    db.run(
      `INSERT INTO activities (id, lead_id, type, outcome, notes) VALUES (?, ?, 'call', ?, ?)`,
      [activityId, data.lead_id, outcomeMap[data.outcome] || 'neutral', data.notes || null]
    )

    // Update lead status based on outcome
    const statusMap: Record<string, string> = {
      positive: 'interested',
      meeting_booked: 'interested',
      not_interested: 'not_interested'
    }
    if (statusMap[data.outcome]) {
      db.run(`UPDATE leads SET status = ?, updated_at = datetime('now') WHERE id = ?`, [statusMap[data.outcome], data.lead_id])
    } else {
      db.run(`UPDATE leads SET updated_at = datetime('now') WHERE id = ?`, [data.lead_id])
    }
    // Mark contacted at minimum
    if (data.outcome === 'no_answer') {
      db.run(`UPDATE leads SET status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END, updated_at = datetime('now') WHERE id = ?`, [data.lead_id])
    }

    // Update session stats
    if (data.session_id) {
      callSessionRepo.incrementStat(data.session_id, 'calls_made')
      if (data.outcome !== 'no_answer') {
        callSessionRepo.incrementStat(data.session_id, 'calls_answered')
      }
      if (data.outcome === 'meeting_booked') {
        callSessionRepo.incrementStat(data.session_id, 'meetings_booked')
      }
    }

    // Schedule follow-up if date provided
    if (data.follow_up_date) {
      const fuId = uuidv4()
      db.run(
        `INSERT INTO follow_ups (id, lead_id, type, due_date) VALUES (?, ?, 'call', ?)`,
        [fuId, data.lead_id, data.follow_up_date]
      )
    }

    saveDB()
    return { activityId, outcome: data.outcome }
  })

  safeHandle('callmode:startSession', (mode?: string) => {
    const id = uuidv4()
    callSessionRepo.create({ id, mode: mode || 'normal' })
    return callSessionRepo.get(id)
  })

  safeHandle('callmode:endSession', (sessionId: string) => {
    callSessionRepo.end(sessionId)
    return callSessionRepo.get(sessionId)
  })

  safeHandle('callmode:getSession', (sessionId: string) => {
    return callSessionRepo.get(sessionId)
  })
}
