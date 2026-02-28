import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
  }
}

interface LicenseInfo {
  valid: boolean
  tier: 'free' | 'premium'
  status?: string
}

interface AuthState {
  user: AuthUser | null
  license: LicenseInfo
  loading: boolean
  error: string | null

  restoreSession: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; confirmEmail?: boolean }>
  signOut: () => Promise<void>
  checkLicense: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  license: { valid: false, tier: 'free' },
  loading: true,
  error: null,

  restoreSession: async () => {
    set({ loading: true })
    try {
      const result = await window.api.auth.restoreSession()
      if (result.user) {
        set({ user: result.user, loading: false })
        // Check license in background
        get().checkLicense()
      } else {
        set({ user: null, loading: false })
      }
    } catch {
      set({ user: null, loading: false })
    }
  },

  signIn: async (email, password) => {
    set({ error: null })
    const result = await window.api.auth.signIn(email, password)
    if (result.error) {
      set({ error: result.error })
      return false
    }
    set({ user: result.user })
    get().checkLicense()
    return true
  },

  signUp: async (email, password, fullName) => {
    set({ error: null })
    const result = await window.api.auth.signUp(email, password, fullName)
    if (result.error) {
      set({ error: result.error })
      return { success: false }
    }
    if (result.confirmEmail) {
      return { success: true, confirmEmail: true }
    }
    set({ user: result.user })
    return { success: true }
  },

  signOut: async () => {
    await window.api.auth.signOut()
    set({ user: null, license: { valid: false, tier: 'free' } })
  },

  checkLicense: async () => {
    const user = get().user
    if (!user?.email) return
    try {
      const result = await window.api.auth.checkLicense(user.email)
      set({ license: { valid: result.valid, tier: result.tier || 'free', status: result.status } })
    } catch {
      set({ license: { valid: false, tier: 'free' } })
    }
  },

  clearError: () => set({ error: null })
}))
