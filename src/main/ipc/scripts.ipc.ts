import { ipcMain } from 'electron'
import { scriptsRepo, objectionRepo } from '../database/repositories/scripts'
import { generateScript, generateObjectionResponses } from '../services/script-generator.service'

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

export function registerScriptsIPC(): void {
  safeHandle('scripts:getAll', () => {
    return scriptsRepo.getAll()
  })

  safeHandle('scripts:save', (script: any) => {
    const id = scriptsRepo.save(script)
    return { id }
  })

  safeHandle('scripts:delete', (id: string) => {
    scriptsRepo.delete(id)
    return { success: true }
  })

  safeHandle('scripts:generate', (context: any) => {
    return generateScript(context)
  })

  safeHandle('scripts:trackUsage', (id: string, success: boolean) => {
    scriptsRepo.trackUsage(id, success)
    return { success: true }
  })

  safeHandle('scripts:getObjections', () => {
    return objectionRepo.getAll()
  })

  safeHandle('scripts:saveObjection', (obj: any) => {
    const id = objectionRepo.save(obj)
    return { id }
  })

  safeHandle('scripts:deleteObjection', (id: string) => {
    objectionRepo.delete(id)
    return { success: true }
  })

  safeHandle('scripts:generateObjections', (context: any) => {
    return generateObjectionResponses(context)
  })
}
