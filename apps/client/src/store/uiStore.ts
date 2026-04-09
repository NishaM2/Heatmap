import { create } from 'zustand'

interface UIStore {
  // Active category for heatmap view
  activeCategoryId: string | null
  setActiveCategoryId: (id: string | null) => void

  // Day modal state
  selectedDate: string | null
  selectedCategoryId: string | null
  isDayModalOpen: boolean
  openDayModal: (date: string, categoryId: string) => void
  closeDayModal: () => void

  // Comparison mode
  comparisonMode: boolean
  setComparisonMode: (mode: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeCategoryId: null,
  setActiveCategoryId: (id) => set({ activeCategoryId: id }),

  selectedDate: null,
  selectedCategoryId: null,
  isDayModalOpen: false,
  openDayModal: (date, categoryId) => set({
    selectedDate: date,
    selectedCategoryId: categoryId,
    isDayModalOpen: true
  }),
  closeDayModal: () => set({
    selectedDate: null,
    selectedCategoryId: null,
    isDayModalOpen: false
  }),

  comparisonMode: false,
  setComparisonMode: (mode) => set({ comparisonMode: mode }),
}))