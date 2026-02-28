import { create } from 'zustand'
import type { UserProfile, Achievement, DailyStats } from '../types/gamification'
import type { ActivityType } from '../types/activity'
import { XP_RULES, LEAD_SAVE_XP } from '../lib/xp-rules'
import { getLevelForXP } from '../lib/levels'
import { ACHIEVEMENT_DEFS } from '../lib/achievements'

interface XPEvent {
  id: string
  amount: number
  timestamp: number
}

interface GamificationState {
  profile: UserProfile | null
  achievements: Achievement[]
  recentDailyStats: DailyStats[]
  xpEvents: XPEvent[]
  levelUpPending: { oldLevel: number; newLevel: number; title: string } | null
  achievementUnlocked: Achievement | null
  load: () => Promise<void>
  logActivity: (type: ActivityType) => Promise<void>
  logLeadSave: () => Promise<void>
  dismissLevelUp: () => void
  dismissAchievement: () => void
  clearXPEvent: (id: string) => void
  checkAchievements: (profile: UserProfile) => Promise<void>
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profile: null,
  achievements: [],
  recentDailyStats: [],
  xpEvents: [],
  levelUpPending: null,
  achievementUnlocked: null,

  load: async () => {
    const profile = await window.api.gamification.getProfile()
    const achievements = await window.api.gamification.getAchievements()
    const recentDailyStats = await window.api.gamification.getRecentDailyStats(30)

    // Seed achievements if empty
    if (achievements.length === 0) {
      for (const def of ACHIEVEMENT_DEFS) {
        await window.api.gamification.upsertAchievement({
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          category: def.category,
          requirement: def.requirement,
          unlocked: 0,
          unlocked_at: null,
          progress: 0
        })
      }
      const seeded = await window.api.gamification.getAchievements()
      set({ profile, achievements: seeded as Achievement[], recentDailyStats })
    } else {
      set({ profile, achievements: achievements as Achievement[], recentDailyStats })
    }
  },

  logActivity: async (type) => {
    const xp = XP_RULES[type]
    if (xp > 0) {
      const updated = await window.api.gamification.addXP(xp)
      const oldProfile = get().profile
      const oldLevel = oldProfile?.level || 1
      const newLevelObj = getLevelForXP(updated.xp)

      if (newLevelObj.level !== updated.level) {
        await window.api.gamification.updateProfile({ level: newLevelObj.level })
      }

      // XP event
      const eventId = `${Date.now()}-${Math.random()}`
      set((s) => ({
        xpEvents: [...s.xpEvents, { id: eventId, amount: xp, timestamp: Date.now() }]
      }))

      // Level up check
      if (newLevelObj.level > oldLevel) {
        set({ levelUpPending: { oldLevel, newLevel: newLevelObj.level, title: newLevelObj.title } })
      }
    }

    // Increment stat
    const statMap: Partial<Record<ActivityType, string>> = {
      call: 'total_calls',
      email: 'total_emails',
      meeting: 'total_meetings',
      deal_closed: 'total_deals'
    }
    const stat = statMap[type]
    if (stat) {
      await window.api.gamification.incrementStat(stat)
    }

    // Daily stats
    const today = new Date().toISOString().split('T')[0]
    const dailyField = type === 'call' ? 'calls' : type === 'email' ? 'emails' : type === 'meeting' ? 'meetings' : type === 'deal_closed' ? 'deals' : null
    if (dailyField) {
      await window.api.gamification.upsertDailyStats(today, dailyField, 1)
    }
    if (xp > 0) {
      await window.api.gamification.upsertDailyStats(today, 'xp_earned', xp)
    }

    // Streak
    await window.api.gamification.updateStreak()

    // Re-load profile and check achievements
    const profile = await window.api.gamification.getProfile()
    set({ profile })

    // Check achievements
    await get().checkAchievements(profile)
  },

  logLeadSave: async () => {
    const xp = LEAD_SAVE_XP
    await window.api.gamification.incrementStat('total_leads')
    const updated = await window.api.gamification.addXP(xp)
    const oldProfile = get().profile
    const oldLevel = oldProfile?.level || 1
    const newLevelObj = getLevelForXP(updated.xp)

    if (newLevelObj.level !== updated.level) {
      await window.api.gamification.updateProfile({ level: newLevelObj.level })
    }

    const eventId = `${Date.now()}-${Math.random()}`
    set((s) => ({
      xpEvents: [...s.xpEvents, { id: eventId, amount: xp, timestamp: Date.now() }]
    }))

    if (newLevelObj.level > oldLevel) {
      set({ levelUpPending: { oldLevel, newLevel: newLevelObj.level, title: newLevelObj.title } })
    }

    const profile = await window.api.gamification.getProfile()
    set({ profile })
  },

  checkAchievements: async (profile: UserProfile) => {
    const totalLeads = await window.api.leads.getCount()
    const fieldValues: Record<string, number> = {
      total_calls: profile.total_calls,
      total_emails: profile.total_emails,
      total_meetings: profile.total_meetings,
      total_deals: profile.total_deals,
      streak_days: profile.streak_days,
      total_leads: totalLeads
    }

    for (const def of ACHIEVEMENT_DEFS) {
      const currentValue = fieldValues[def.field] || 0
      const existing = get().achievements.find((a) => a.id === def.id)

      if (existing && !existing.unlocked && currentValue >= def.requirement) {
        await window.api.gamification.upsertAchievement({
          ...existing,
          unlocked: 1,
          unlocked_at: new Date().toISOString(),
          progress: currentValue
        })
        set({
          achievementUnlocked: { ...existing, unlocked: true, unlocked_at: new Date().toISOString(), progress: currentValue }
        })
      } else if (existing && !existing.unlocked) {
        await window.api.gamification.upsertAchievement({
          ...existing,
          progress: currentValue
        })
      }
    }

    const achievements = await window.api.gamification.getAchievements()
    set({ achievements: achievements as Achievement[] })
  },

  dismissLevelUp: () => set({ levelUpPending: null }),
  dismissAchievement: () => set({ achievementUnlocked: null }),
  clearXPEvent: (id) => set((s) => ({ xpEvents: s.xpEvents.filter((e) => e.id !== id) }))
}))
