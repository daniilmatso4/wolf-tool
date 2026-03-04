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
  oauthLoading: boolean
  error: string | null

  restoreSession: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; confirmEmail?: boolean }>
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>
  signOut: () => Promise<void>
  checkLicense: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  license: { valid: false, tier: 'free' },
  loading: true,
  oauthLoading: false,
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

  signInWithProvider: async (provider) => {
    set({ error: null, oauthLoading: true })
    const result = await window.api.auth.signInWithProvider(provider)
    if (result.error) {
      set({ error: result.error, oauthLoading: false })
    }
    // oauthLoading stays true until callback arrives via onOAuthResult
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

// Subscribe to OAuth callback results from main process
window.api.auth.onOAuthResult((data: unknown) => {
  const result = data as { user?: AuthUser; error?: string }
  if (result.error) {
    useAuthStore.setState({ error: result.error, oauthLoading: false })
  } else if (result.user) {
    useAuthStore.setState({ user: result.user, oauthLoading: false })
    useAuthStore.getState().checkLicense()
  }
})
