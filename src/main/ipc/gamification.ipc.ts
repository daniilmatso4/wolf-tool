import { safeHandle } from './ipc-utils'
import { gamificationRepo } from '../database/repositories/gamification'
import { debouncedSync, syncGamificationToSupabase } from '../services/supabase-sync.service'

export function registerGamificationIPC(): void {
  safeHandle('gamification:getProfile', () => gamificationRepo.getProfile())
  safeHandle('gamification:updateProfile', (_e, fields) => gamificationRepo.updateProfile(fields))
  safeHandle('gamification:addXP', (_e, amount: number) => {
    const result = gamificationRepo.addXP(amount)
    debouncedSync()
    return result
  })
  safeHandle('gamification:incrementStat', (_e, field) => {
    gamificationRepo.incrementStat(field)
    debouncedSync()
  })
  safeHandle('gamification:getAchievements', () => gamificationRepo.getAchievements())
  safeHandle('gamification:upsertAchievement', (_e, a) => {
    gamificationRepo.upsertAchievement(a)
    if (a.unlocked) debouncedSync()
  })
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

  // Sync on startup (debounced)
  debouncedSync()

  // Manual sync trigger
  safeHandle('gamification:syncToCloud', () => syncGamificationToSupabase())
}
