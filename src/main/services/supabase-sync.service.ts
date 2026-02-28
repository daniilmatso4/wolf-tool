import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { gamificationRepo } from '../database/repositories/gamification'
import Store from 'electron-store'

const store = new Store()

let _client: SupabaseClient | null = null
let _syncTimeout: ReturnType<typeof setTimeout> | null = null

function getSupabase(): SupabaseClient | null {
  if (_client) return _client

  const url = store.get('supabaseUrl') as string | undefined
  const key = store.get('supabaseAnonKey') as string | undefined
  const token = store.get('supabaseAccessToken') as string | undefined

  if (!url || !key) return null

  _client = createClient(url, key, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  })

  return _client
}

function getUserId(): string | null {
  return (store.get('userId') as string) ?? null
}

export async function syncGamificationToSupabase(): Promise<void> {
  const supabase = getSupabase()
  const userId = getUserId()
  if (!supabase || !userId) return

  try {
    // Sync profile
    const profile = gamificationRepo.getProfile()

    await supabase.from('gamification_profiles').upsert(
      {
        user_id: userId,
        username: profile.username,
        xp: profile.xp,
        level: profile.level,
        streak_days: profile.streak_days,
        total_calls: profile.total_calls,
        total_emails: profile.total_emails,
        total_meetings: profile.total_meetings,
        total_deals: profile.total_deals,
        total_leads: profile.total_leads,
        synced_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    )

    // Sync achievements
    const achievements = gamificationRepo.getAchievements()
    const unlocked = achievements.filter((a) => a.unlocked === 1)

    for (const a of unlocked) {
      await supabase.from('gamification_achievements').upsert(
        {
          user_id: userId,
          achievement_id: a.id,
          achievement_name: a.name,
          achievement_description: a.description ?? '',
          unlocked_at: a.unlocked_at ?? new Date().toISOString()
        },
        { onConflict: 'user_id,achievement_id' }
      )
    }
  } catch (err) {
    console.error('[SupabaseSync] Sync failed:', err)
  }
}

/**
 * Debounced sync — coalesces rapid XP/achievement events
 * into a single Supabase upsert after 2 seconds of inactivity.
 */
export function debouncedSync(): void {
  if (_syncTimeout) clearTimeout(_syncTimeout)
  _syncTimeout = setTimeout(() => {
    syncGamificationToSupabase()
  }, 2000)
}

/**
 * Clear the cached Supabase client (e.g. on logout).
 */
export function resetSyncClient(): void {
  _client = null
}
