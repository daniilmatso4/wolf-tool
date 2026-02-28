import { create } from 'zustand'
import type { Lead, LeadStatus } from '../types/lead'

interface LeadsState {
  leads: Lead[]
  loading: boolean
  statusCounts: Record<string, number>
  load: () => Promise<void>
  loadStatusCounts: () => Promise<void>
  addLead: (lead: Lead) => void
  updateLead: (id: string, fields: Partial<Lead>) => Promise<void>
  removeLead: (id: string) => Promise<void>
  getLeadById: (id: string) => Lead | undefined
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  loading: false,
  statusCounts: {},

  load: async () => {
    set({ loading: true })
    const rows = await window.api.leads.getAll()
    const leads = rows.map((r: Record<string, unknown>) => ({
      ...r,
      has_website: !!r.has_website
    })) as Lead[]
    set({ leads, loading: false })
  },

  loadStatusCounts: async () => {
    const counts = await window.api.leads.getCountByStatus()
    set({ statusCounts: counts })
  },

  addLead: (lead) => {
    set((s) => ({ leads: [lead, ...s.leads] }))
  },

  updateLead: async (id, fields) => {
    const updated = await window.api.leads.update(id, fields)
    if (updated) {
      set((s) => ({
        leads: s.leads.map((l) => (l.id === id ? { ...l, ...updated, has_website: !!updated.has_website } : l))
      }))
    }
  },

  removeLead: async (id) => {
    await window.api.leads.delete(id)
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }))
  },

  getLeadById: (id) => get().leads.find((l) => l.id === id)
}))
