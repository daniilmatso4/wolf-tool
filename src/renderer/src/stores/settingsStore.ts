import { create } from 'zustand'
import type { Settings } from '../types/settings'

interface SettingsState {
  settings: Settings
  loaded: boolean
  load: () => Promise<void>
  update: (key: keyof Settings, value: string) => Promise<void>
}

const defaults: Settings = {
  google_api_key: '',
  username: 'Broker'
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaults,
  loaded: false,

  load: async () => {
    const all = await window.api.settings.getAll()
    set({
      settings: {
        google_api_key: all.google_api_key || '',
        username: all.username || 'Broker'
      },
      loaded: true
    })
  },

  update: async (key, value) => {
    await window.api.settings.set(key, String(value))
    set({ settings: { ...get().settings, [key]: value } })
  }
}))
