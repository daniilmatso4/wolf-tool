import { create } from 'zustand'
import type { MyProduct } from '../types/product'

interface ProductState {
  product: MyProduct | null
  isConfigured: boolean
  loading: boolean
  load: () => Promise<void>
  update: (fields: Partial<MyProduct>) => Promise<void>
  checkConfigured: () => Promise<void>
}

export const useProductStore = create<ProductState>((set) => ({
  product: null,
  isConfigured: false,
  loading: true,

  load: async () => {
    try {
      const product = await window.api.product.get()
      const isConfigured = await window.api.product.isConfigured()
      set({ product, isConfigured, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  update: async (fields) => {
    const updated = await window.api.product.update(fields)
    const isConfigured = await window.api.product.isConfigured()
    set({ product: updated, isConfigured })
  },

  checkConfigured: async () => {
    const isConfigured = await window.api.product.isConfigured()
    set({ isConfigured })
  }
}))
