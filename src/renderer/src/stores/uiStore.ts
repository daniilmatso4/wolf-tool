import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  pipelineView: 'kanban' | 'table'
  toggleSidebar: () => void
  setPipelineView: (v: 'kanban' | 'table') => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  pipelineView: 'kanban',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setPipelineView: (v) => set({ pipelineView: v })
}))
