import { safeHandle } from './ipc-utils'
import { gamificationRepo } from '../database/repositories/gamification'

export function registerGamificationIPC(): void {
  safeHandle('gamification:getProfile', () => gamificationRepo.getProfile())
  safeHandle('gamification:updateProfile', (_e, fields) => gamificationRepo.updateProfile(fields))
  safeHandle('gamification:addXP', (_e, amount: number) => gamificationRepo.addXP(amount))
  safeHandle('gamification:incrementStat', (_e, field) => gamificationRepo.incrementStat(field))
  safeHandle('gamification:getAchievements', () => gamificationRepo.getAchievements())
  safeHandle('gamification:upsertAchievement', (_e, a) => gamificationRepo.upsertAchievement(a))
  safeHandle('gamification:getDailyStats', (_e, date: string) =>
    gamificationRepo.getDailyStats(date)
  )
  safeHandle('gamification:upsertDailyStats', (_e, date: string, field: string, amount: number) =>
    gamificationRepo.upsertDailyStats(date, field, amount)
  )
  safeHandle('gamification:getRecentDailyStats', (_e, days?: number) =>
    gamificationRepo.getRecentDailyStats(days)
  )
  safeHandle('gamification:updateStreak', () => gamificationRepo.updateStreak())
}
