import { ipcMain } from 'electron'
import { productRepo } from '../database/repositories/product'

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

export function registerProductIPC(): void {
  safeHandle('product:get', () => {
    const row = productRepo.get()
    if (!row) return null
    return {
      ...row,
      key_benefits: JSON.parse((row.key_benefits as string) || '[]'),
      target_industries: JSON.parse((row.target_industries as string) || '[]'),
      unique_selling_points: JSON.parse((row.unique_selling_points as string) || '[]'),
      common_objections: JSON.parse((row.common_objections as string) || '[]'),
      competitors: JSON.parse((row.competitors as string) || '[]')
    }
  })

  safeHandle('product:update', (_data: Record<string, unknown>) => {
    const data = { ..._data }
    // Serialize arrays to JSON for storage
    if (Array.isArray(data.key_benefits)) data.key_benefits = JSON.stringify(data.key_benefits)
    if (Array.isArray(data.target_industries)) data.target_industries = JSON.stringify(data.target_industries)
    if (Array.isArray(data.unique_selling_points)) data.unique_selling_points = JSON.stringify(data.unique_selling_points)
    if (Array.isArray(data.common_objections)) data.common_objections = JSON.stringify(data.common_objections)
    if (Array.isArray(data.competitors)) data.competitors = JSON.stringify(data.competitors)

    productRepo.upsert(data as any)
    // Return updated product
    const row = productRepo.get()
    if (!row) return null
    return {
      ...row,
      key_benefits: JSON.parse((row.key_benefits as string) || '[]'),
      target_industries: JSON.parse((row.target_industries as string) || '[]'),
      unique_selling_points: JSON.parse((row.unique_selling_points as string) || '[]'),
      common_objections: JSON.parse((row.common_objections as string) || '[]'),
      competitors: JSON.parse((row.competitors as string) || '[]')
    }
  })

  safeHandle('product:isConfigured', () => {
    return productRepo.isConfigured()
  })
}
