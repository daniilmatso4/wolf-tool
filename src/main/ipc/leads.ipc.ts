import { safeHandle } from './ipc-utils'
import { leadsRepo } from '../database/repositories/leads'

export function registerLeadsIPC(): void {
  safeHandle('leads:getAll', () => leadsRepo.getAll())
  safeHandle('leads:getByStatus', (_e, status: string) => leadsRepo.getByStatus(status))
  safeHandle('leads:getById', (_e, id: string) => leadsRepo.getById(id))
  safeHandle('leads:existsByPlaceId', (_e, placeId: string) => leadsRepo.existsByPlaceId(placeId))
  safeHandle('leads:create', (_e, lead) => leadsRepo.create(lead))
  safeHandle('leads:update', (_e, id: string, fields) => leadsRepo.update(id, fields))
  safeHandle('leads:delete', (_e, id: string) => leadsRepo.delete(id))
  safeHandle('leads:getCount', () => leadsRepo.getCount())
  safeHandle('leads:getCountByStatus', () => leadsRepo.getCountByStatus())
}
