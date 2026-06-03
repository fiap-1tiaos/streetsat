import { create } from 'zustand'
import type { Occurrence, Alert } from '@/lib/utils'

interface Store {
  occurrences: Occurrence[]
  alerts: Alert[]
  apiOnline: boolean
  lastUpdated: Date | null
  setOccurrences: (data: Occurrence[]) => void
  setAlerts: (data: Alert[]) => void
  setApiOnline: (v: boolean) => void
  setLastUpdated: (d: Date) => void
}

export const useOccurrencesStore = create<Store>((set) => ({
  occurrences: [],
  alerts: [],
  apiOnline: false,
  lastUpdated: null,
  setOccurrences: (data) => set({ occurrences: data }),
  setAlerts: (data) => set({ alerts: data }),
  setApiOnline: (v) => set({ apiOnline: v }),
  setLastUpdated: (d) => set({ lastUpdated: d }),
}))
