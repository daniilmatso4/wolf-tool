import { ipcMain } from 'electron'
import { generateEmail } from '../services/email-generator.service'
import { emailTemplateRepo, sentEmailRepo } from '../database/repositories/emails'

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

export function registerEmailIPC(): void {
  safeHandle('email:generate', (context: any) => {
    return generateEmail(context)
  })

  safeHandle('email:getTemplates', () => {
    return emailTemplateRepo.getAll()
  })

  safeHandle('email:saveTemplate', (template: any) => {
    const id = emailTemplateRepo.save(template)
    return { id }
  })

  safeHandle('email:deleteTemplate', (id: string) => {
    emailTemplateRepo.delete(id)
    return { success: true }
  })

  safeHandle('email:logSent', (data: any) => {
    const id = sentEmailRepo.log(data)
    return { id }
  })
}
