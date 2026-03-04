import { ipcMain } from 'electron'
import { analyticsRepo } from '../database/repositories/analytics'
import { generateWeeklyInsights } from '../services/analytics-insights.service'

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

export function registerAnalyticsIPC(): void {
  safeHandle('analytics:getVolumeTrends', (days?: number) => {
    return analyticsRepo.getVolumeTrends(days || 30)
  })

  safeHandle('analytics:getConversionFunnel', () => {
    return analyticsRepo.getConversionFunnel()
  })

  safeHandle('analytics:getCallHeatmap', () => {
    return analyticsRepo.getCallHeatmap()
  })

  safeHandle('analytics:getIndustryStats', () => {
    return analyticsRepo.getIndustryStats()
  })

  safeHandle('analytics:getWeeklyInsights', () => {
    return generateWeeklyInsights()
  })
}
