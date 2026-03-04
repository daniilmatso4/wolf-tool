import { create } from 'zustand'
import type { FollowUp, CadenceTemplate } from '../types/followup'

interface FollowUpState {
  dueToday: FollowUp[]
  overdue: FollowUp[]
  cadences: CadenceTemplate[]
  loading: boolean

  load: () => Promise<void>
  loadCadences: () => Promise<void>
  complete: (id: string) => Promise<void>
  skip: (id: string) => Promise<void>
  schedule: (data: { lead_id: string; type?: string; due_date: string; notes?: string }) => Promise<void>
  scheduleFromCadence: (leadId: string, cadenceId: string) => Promise<void>
}

export const useFollowUpStore = create<FollowUpState>((set, get) => ({
  dueToday: [],
  overdue: [],
  cadences: [],
  loading: true,

  load: async () => {
    const [dueToday, overdue] = await Promise.all([
      window.api.followups.getDueToday(),
      window.api.followups.getOverdue()
    ])
    set({ dueToday, overdue, loading: false })
  },

  loadCadences: async () => {
    const cadences = await window.api.followups.getCadences()
    set({ cadences })
  },

  complete: async (id: string) => {
    await window.api.followups.complete(id)
    await get().load()
  },

  skip: async (id: string) => {
    await window.api.followups.skip(id)
    await get().load()
  },

  schedule: async (data) => {
    await window.api.followups.schedule(data)
    await get().load()
  },

  scheduleFromCadence: async (leadId: string, cadenceId: string) => {
    await window.api.followups.scheduleFromCadence(leadId, cadenceId)
    await get().load()
  }
}))
