import { ipcMain } from 'electron'
import { followUpsRepo, cadenceRepo } from '../database/repositories/followups'

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

export function registerFollowUpsIPC(): void {
  safeHandle('followups:getDueToday', () => {
    return followUpsRepo.getDueToday()
  })

  safeHandle('followups:getOverdue', () => {
    return followUpsRepo.getOverdue()
  })

  safeHandle('followups:getByLead', (leadId: string) => {
    return followUpsRepo.getByLead(leadId)
  })

  safeHandle('followups:schedule', (data: any) => {
    return followUpsRepo.schedule(data)
  })

  safeHandle('followups:scheduleFromCadence', (leadId: string, cadenceId: string) => {
    followUpsRepo.scheduleFromCadence(leadId, cadenceId)
    return { success: true }
  })

  safeHandle('followups:complete', (id: string) => {
    followUpsRepo.complete(id)
    return { success: true }
  })

  safeHandle('followups:skip', (id: string) => {
    followUpsRepo.skip(id)
    return { success: true }
  })

  safeHandle('followups:getCadences', () => {
    const cadences = cadenceRepo.getAll()
    return cadences.map((c) => ({
      ...c,
      steps: JSON.parse((c.steps as string) || '[]')
    }))
  })

  safeHandle('followups:saveCadence', (cadence: any) => {
    cadenceRepo.save({
      ...cadence,
      steps: typeof cadence.steps === 'string' ? cadence.steps : JSON.stringify(cadence.steps)
    })
    return { success: true }
  })

  safeHandle('followups:deleteCadence', (id: string) => {
    cadenceRepo.delete(id)
    return { success: true }
  })
}
