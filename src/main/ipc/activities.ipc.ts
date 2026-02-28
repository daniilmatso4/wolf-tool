import { safeHandle } from './ipc-utils'
import { activitiesRepo } from '../database/repositories/activities'

export function registerActivitiesIPC(): void {
  safeHandle('activities:getByLeadId', (_e, leadId: string) =>
    activitiesRepo.getByLeadId(leadId)
  )
  safeHandle('activities:getRecent', (_e, limit?: number) => activitiesRepo.getRecent(limit))
  safeHandle('activities:create', (_e, activity) => activitiesRepo.create(activity))
  safeHandle('activities:getTodayCounts', () => activitiesRepo.getTodayCounts())
}
