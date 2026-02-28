import { create } from 'zustand'
import type { AgentId, AgentStatus, AgentConfig, BrandAnalysis, LinkedInProspect } from '../types/agents'

const AGENT_CONFIGS: AgentConfig[] = [
  { id: 'jordan', name: 'Jordan Belfort', title: 'The Closer', avatar: 'WolfLogo', color: 'text-gold' },
  { id: 'donnie', name: 'Donnie Azoff', title: 'The Hustler', avatar: 'Flame', color: 'text-blue-400' },
  { id: 'naomi', name: 'Naomi Lapaglia', title: 'The Strategist', avatar: 'Gem', color: 'text-purple-400' }
]

interface AgentLiveState {
  status: AgentStatus
  runId: string | null
  prospect: LinkedInProspect | null
  craftedMessage: string | null
  error: string | null
}

interface AgentsState {
  configs: AgentConfig[]
  linkedinLoggedIn: boolean
  sessionId: string | null
  targetUrl: string
  brandAnalysis: BrandAnalysis | null
  agentStates: Record<AgentId, AgentLiveState>
  deploying: boolean

  checkLinkedIn: () => Promise<void>
  loginLinkedIn: () => Promise<void>
  setTargetUrl: (url: string) => void
  startSession: () => Promise<void>
  approveAgent: (agentId: AgentId) => Promise<void>
  rejectAgent: (agentId: AgentId) => Promise<void>
  stopAll: () => Promise<void>
  initListeners: () => () => void
}

const defaultAgentState: AgentLiveState = {
  status: 'idle',
  runId: null,
  prospect: null,
  craftedMessage: null,
  error: null
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  configs: AGENT_CONFIGS,
  linkedinLoggedIn: false,
  sessionId: null,
  targetUrl: '',
  brandAnalysis: null,
  deploying: false,
  agentStates: {
    jordan: { ...defaultAgentState },
    donnie: { ...defaultAgentState },
    naomi: { ...defaultAgentState }
  },

  checkLinkedIn: async () => {
    const result = await window.api.agents.linkedinStatus()
    set({ linkedinLoggedIn: result.loggedIn })
  },

  loginLinkedIn: async () => {
    try {
      await window.api.agents.linkedinLogin()
      set({ linkedinLoggedIn: true })
    } catch {
      // User closed the login window
    }
  },

  setTargetUrl: (url) => set({ targetUrl: url }),

  startSession: async () => {
    const { targetUrl } = get()
    if (!targetUrl) return

    set({ deploying: true })
    try {
      const { sessionId } = await window.api.agents.startSession(targetUrl)
      set({ sessionId })
      await window.api.agents.startAll(targetUrl, sessionId)
    } catch (err: any) {
      set({ deploying: false })
      // Show error on all agents
      const errorMsg = err?.message || 'Failed to start session'
      set((s) => ({
        agentStates: {
          jordan: { ...defaultAgentState, status: 'error', error: errorMsg },
          donnie: { ...defaultAgentState, status: 'error', error: errorMsg },
          naomi: { ...defaultAgentState, status: 'error', error: errorMsg }
        }
      }))
      return
    }
    set({ deploying: false })
  },

  approveAgent: async (agentId) => {
    const runId = get().agentStates[agentId].runId
    if (!runId) return
    await window.api.agents.approve(agentId, runId)
  },

  rejectAgent: async (agentId) => {
    const runId = get().agentStates[agentId].runId
    if (!runId) return
    set((s) => ({
      agentStates: {
        ...s.agentStates,
        [agentId]: { ...s.agentStates[agentId], status: 'searching_linkedin' as AgentStatus, prospect: null, craftedMessage: null }
      }
    }))
    await window.api.agents.reject(agentId, runId)
  },

  stopAll: async () => {
    await window.api.agents.stopAll()
    set({
      sessionId: null,
      brandAnalysis: null,
      deploying: false,
      agentStates: {
        jordan: { ...defaultAgentState },
        donnie: { ...defaultAgentState },
        naomi: { ...defaultAgentState }
      }
    })
  },

  initListeners: () => {
    const cleanupStatus = window.api.agents.onStatus((data: any) => {
      set((s) => ({
        agentStates: {
          ...s.agentStates,
          [data.agentId]: {
            ...s.agentStates[data.agentId as AgentId],
            status: data.status,
            runId: data.runId || s.agentStates[data.agentId as AgentId].runId,
            error: data.error || null
          }
        }
      }))
    })

    const cleanupReview = window.api.agents.onReview((data: any) => {
      set((s) => ({
        agentStates: {
          ...s.agentStates,
          [data.agentId]: {
            ...s.agentStates[data.agentId as AgentId],
            status: 'review_required' as AgentStatus,
            runId: data.runId,
            prospect: data.prospect,
            craftedMessage: data.message
          }
        }
      }))
    })

    const cleanupBrand = window.api.agents.onBrandAnalysis((data: any) => {
      set({ brandAnalysis: data.brandAnalysis })
    })

    const cleanupSent = window.api.agents.onSent((data: any) => {
      set((s) => ({
        agentStates: {
          ...s.agentStates,
          [data.agentId]: { ...defaultAgentState }
        }
      }))
    })

    return () => {
      cleanupStatus()
      cleanupReview()
      cleanupBrand()
      cleanupSent()
    }
  }
}))
