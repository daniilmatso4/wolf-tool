import { create } from 'zustand'
import type { PlaceResult } from '../types/search'

interface SearchState {
  results: PlaceResult[]
  loading: boolean
  error?: string
  nextPageToken?: string
  query: string
  filterNoWebsite: boolean
  search: (query: string, apiKey: string) => Promise<void>
  loadMore: (apiKey: string) => Promise<void>
  setFilterNoWebsite: (v: boolean) => void
  clearResults: () => void
  markAsSaved: (placeId: string) => void
}

export const useSearchStore = create<SearchState>((set, get) => ({
  results: [],
  loading: false,
  error: undefined,
  nextPageToken: undefined,
  query: '',
  filterNoWebsite: false,

  search: async (query, apiKey) => {
    set({ loading: true, error: undefined, query })
    const resp = await window.api.search.places(query, apiKey)
    if (resp.error) {
      set({ loading: false, error: resp.error, results: [] })
      return
    }
    // Check which are already saved
    const results: PlaceResult[] = []
    for (const r of resp.results) {
      const exists = await window.api.leads.existsByPlaceId(r.place_id)
      results.push({ ...r, already_saved: exists })
    }
    set({ results, loading: false, nextPageToken: resp.nextPageToken })
  },

  loadMore: async (apiKey) => {
    const { nextPageToken, query, results: existing } = get()
    if (!nextPageToken) return
    set({ loading: true })
    const resp = await window.api.search.places(query, apiKey, nextPageToken)
    if (resp.error) {
      set({ loading: false, error: resp.error })
      return
    }
    const newResults: PlaceResult[] = []
    for (const r of resp.results) {
      const exists = await window.api.leads.existsByPlaceId(r.place_id)
      newResults.push({ ...r, already_saved: exists })
    }
    set({ results: [...existing, ...newResults], loading: false, nextPageToken: resp.nextPageToken })
  },

  setFilterNoWebsite: (v) => set({ filterNoWebsite: v }),
  clearResults: () => set({ results: [], nextPageToken: undefined, query: '', error: undefined }),
  markAsSaved: (placeId) =>
    set((s) => ({
      results: s.results.map((r) => (r.place_id === placeId ? { ...r, already_saved: true } : r))
    }))
}))
