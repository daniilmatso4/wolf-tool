import { safeHandle } from './ipc-utils'
import { sentOutreachRepo, leadIntelRepo, ownerDiscoveryRepo } from '../database/repositories/outreach'
import { startMonitor, stopMonitor, isMonitorRunning, checkNow } from '../services/linkedin-monitor.service'
import { getOrGenerateBrief, clearBriefCache } from '../services/lead-intelligence.service'
import { getOrDiscoverOwner, clearOwnerCache } from '../services/owner-discovery.service'

export function registerMonitorIPC(): void {
  // Response monitor controls
  safeHandle('monitor:start', (_e, intervalMinutes?: number) => {
    startMonitor(intervalMinutes)
    return { success: true }
  })

  safeHandle('monitor:stop', () => {
    stopMonitor()
    return { success: true }
  })

  safeHandle('monitor:status', () => {
    return { running: isMonitorRunning() }
  })

  safeHandle('monitor:checkNow', async () => {
    await checkNow()
    return { success: true }
  })

  // Outreach tracking
  safeHandle('outreach:getAll', () => sentOutreachRepo.getAll())
  safeHandle('outreach:getPending', () => sentOutreachRepo.getPending())
  safeHandle('outreach:getResponses', () => sentOutreachRepo.getWithResponses())
  safeHandle('outreach:getUnread', () => sentOutreachRepo.getUnread())
  safeHandle('outreach:markRead', (_e, id: string) => {
    sentOutreachRepo.markRead(id)
    return { success: true }
  })
  safeHandle('outreach:markAllRead', () => {
    sentOutreachRepo.markAllRead()
    return { success: true }
  })
  safeHandle('outreach:getStats', () => sentOutreachRepo.getStats())

  // Lead intelligence
  safeHandle('intel:generate', async (_e, leadId: string, lead: any) => {
    return getOrGenerateBrief(leadId, lead)
  })
  safeHandle('intel:get', (_e, leadId: string) => {
    const cached = leadIntelRepo.get(leadId)
    if (!cached) return null
    return {
      brief: cached.brief,
      talking_points: JSON.parse(cached.talking_points as string),
      pain_points: JSON.parse(cached.pain_points as string),
      suggested_approach: cached.suggested_approach,
      competitive_angle: cached.competitive_angle || ''
    }
  })
  safeHandle('intel:clear', (_e, leadId: string) => {
    clearBriefCache(leadId)
    return { success: true }
  })

  // Owner discovery
  safeHandle('owner:discover', async (_e, leadId: string, lead: any) => {
    return getOrDiscoverOwner(leadId, lead)
  })
  safeHandle('owner:get', (_e, leadId: string) => {
    const cached = ownerDiscoveryRepo.get(leadId)
    if (!cached) return null
    return {
      owner_name: (cached.owner_name as string) || null,
      owner_title: (cached.owner_title as string) || null,
      owner_phone: (cached.owner_phone as string) || null,
      owner_email: (cached.owner_email as string) || null,
      confidence: (cached.confidence as string) || 'none'
    }
  })
  safeHandle('owner:clear', (_e, leadId: string) => {
    clearOwnerCache(leadId)
    return { success: true }
  })

  // Campaign analytics (derived from agent_runs + outreach)
  safeHandle('campaign:stats', () => {
    const outreachStats = sentOutreachRepo.getStats()
    return outreachStats
  })
}
