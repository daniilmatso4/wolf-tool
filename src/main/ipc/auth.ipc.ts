import { ipcMain } from 'electron'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getDB, saveDB } from '../database/connection'

const SUPABASE_URL = 'https://bztjzxbqiajkaelnvika.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_gpzKVc1w9C_cfl_FzIW9ow_Xwr4go5J'
const LICENSE_API_URL = 'https://wolfengine.co/api/license/verify'

let supabase: SupabaseClient

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  }
  return supabase
}

// Store/retrieve session from local SQLite for persistence across app restarts
function saveSession(session: string | null): void {
  const db = getDB()
  if (session) {
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('supabase_session', ?)", [session])
  } else {
    db.run("DELETE FROM settings WHERE key = 'supabase_session'")
  }
  saveDB()
}

function loadSession(): string | null {
  const db = getDB()
  const result = db.exec("SELECT value FROM settings WHERE key = 'supabase_session'")
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as string
  }
  return null
}

export function registerAuthIPC(): void {
  const sb = getSupabase()

  // Restore session on startup
  ipcMain.handle('auth:restoreSession', async () => {
    try {
      const savedSession = loadSession()
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        const { data, error } = await sb.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token
        })
        if (error) {
          saveSession(null)
          return { user: null }
        }
        if (data.session) {
          saveSession(JSON.stringify(data.session))
        }
        return { user: data.user }
      }
      return { user: null }
    } catch {
      saveSession(null)
      return { user: null }
    }
  })

  ipcMain.handle('auth:signIn', async (_e, email: string, password: string) => {
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (data.session) {
      saveSession(JSON.stringify(data.session))
    }
    return { user: data.user }
  })

  ipcMain.handle('auth:signUp', async (_e, email: string, password: string, fullName: string) => {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
    if (error) return { error: error.message }
    return { user: data.user, confirmEmail: !data.session }
  })

  ipcMain.handle('auth:signOut', async () => {
    await sb.auth.signOut()
    saveSession(null)
    return { success: true }
  })

  ipcMain.handle('auth:getUser', async () => {
    const { data } = await sb.auth.getUser()
    return { user: data.user }
  })

  // Check subscription status via the website API
  ipcMain.handle('auth:checkLicense', async (_e, email: string) => {
    try {
      // First try the production API
      const res = await fetch(LICENSE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!res.ok) {
        // If production API is not available, check Supabase directly
        const { data } = await sb.auth.getUser()
        if (!data.user) return { valid: false, tier: 'free' }

        const { data: subscription } = await sb
          .from('subscriptions')
          .select('status, price_id, current_period_end')
          .eq('user_id', data.user.id)
          .in('status', ['active', 'trialing'])
          .single()

        if (subscription) {
          return { valid: true, tier: 'premium', status: subscription.status }
        }
        return { valid: false, tier: 'free' }
      }

      return await res.json()
    } catch {
      // Fallback: check Supabase directly
      try {
        const { data } = await sb.auth.getUser()
        if (!data.user) return { valid: false, tier: 'free' }

        const { data: subscription } = await sb
          .from('subscriptions')
          .select('status')
          .eq('user_id', data.user.id)
          .in('status', ['active', 'trialing'])
          .single()

        return { valid: !!subscription, tier: subscription ? 'premium' : 'free' }
      } catch {
        return { valid: false, tier: 'free' }
      }
    }
  })
}
