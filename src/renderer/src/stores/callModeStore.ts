import { create } from 'zustand'
import type { QueuedLead, CallPrepResult, CallSession, CallOutcome } from '../types/callmode'

interface CallModeState {
  queue: QueuedLead[]
  currentIndex: number
  currentLead: QueuedLead | null
  prep: CallPrepResult | null
  prepLoading: boolean
  session: CallSession | null
  powerHourActive: boolean
  powerHourEndTime: number | null
  loading: boolean

  loadQueue: () => Promise<void>
  startSession: (mode?: 'normal' | 'power_hour') => Promise<void>
  endSession: () => Promise<void>
  loadPrep: (leadId: string) => Promise<void>
  logOutcome: (outcome: CallOutcome, notes?: string, followUpDate?: string) => Promise<void>
  nextLead: () => void
  skipLead: () => void
  refreshSession: () => Promise<void>
}

export const useCallModeStore = create<CallModeState>((set, get) => ({
  queue: [],
  currentIndex: 0,
  currentLead: null,
  prep: null,
  prepLoading: false,
  session: null,
  powerHourActive: false,
  powerHourEndTime: null,
  loading: true,

  loadQueue: async () => {
    set({ loading: true })
    const queue = await window.api.callmode.getQueue(50)
    const currentLead = queue.length > 0 ? queue[0] : null
    set({ queue, currentLead, currentIndex: 0, loading: false })

    // Auto-load prep for first lead
    if (currentLead) {
      get().loadPrep(currentLead.id)
    }
  },

  startSession: async (mode = 'normal') => {
    const session = await window.api.callmode.startSession(mode)
    const isPowerHour = mode === 'power_hour'
    ;(window as any).__powerHourActive = isPowerHour
    set({
      session,
      powerHourActive: isPowerHour,
      powerHourEndTime: isPowerHour ? Date.now() + 60 * 60 * 1000 : null
    })
  },

  endSession: async () => {
    const { session } = get()
    if (session) {
      await window.api.callmode.endSession(session.id)
    }
    ;(window as any).__powerHourActive = false
    set({ session: null, powerHourActive: false, powerHourEndTime: null })
  },

  loadPrep: async (leadId: string) => {
    set({ prepLoading: true, prep: null })
    try {
      const prep = await window.api.callmode.getPrep(leadId)
      set({ prep, prepLoading: false })
    } catch (err) {
      console.error('Failed to load call prep:', err)
      set({ prepLoading: false })
    }
  },

  logOutcome: async (outcome, notes, followUpDate) => {
    const { session, currentLead } = get()
    if (!currentLead) return

    await window.api.callmode.logOutcome({
      lead_id: currentLead.id,
      session_id: session?.id || '',
      outcome,
      notes,
      follow_up_date: followUpDate
    })

    // Refresh session stats
    if (session) {
      const updated = await window.api.callmode.getSession(session.id)
      set({ session: updated })
    }

    // Auto-advance
    get().nextLead()
  },

  nextLead: () => {
    const { queue, currentIndex } = get()
    const nextIndex = currentIndex + 1
    if (nextIndex < queue.length) {
      const nextLead = queue[nextIndex]
      set({ currentIndex: nextIndex, currentLead: nextLead, prep: null })
      get().loadPrep(nextLead.id)
    } else {
      set({ currentLead: null, prep: null })
    }
  },

  skipLead: () => {
    get().nextLead()
  },

  refreshSession: async () => {
    const { session } = get()
    if (session) {
      const updated = await window.api.callmode.getSession(session.id)
      set({ session: updated })
    }
  }
}))
