import { safeHandle } from './ipc-utils'
import { settingsRepo } from '../database/repositories/settings'

export function registerSettingsIPC(): void {
  safeHandle('settings:get', (_e, key: string) => settingsRepo.get(key))
  safeHandle('settings:set', (_e, key: string, value: string) => settingsRepo.set(key, value))
  safeHandle('settings:getAll', () => settingsRepo.getAll())
  safeHandle('settings:delete', (_e, key: string) => settingsRepo.delete(key))
}
