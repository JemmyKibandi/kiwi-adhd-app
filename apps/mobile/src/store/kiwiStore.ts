import { create } from 'zustand'
import { kiwiApi } from '../lib/api'

export type KiwiMood = 'idle' | 'happy' | 'focused' | 'sleepy' | 'celebrating'

interface KiwiStoreState {
  xp: number
  level: number
  outfit: string
  xpProgress: number
  xpForNextLevel: number
  unlockedOutfits: string[]
  mood: KiwiMood
  setMood: (mood: KiwiMood) => void
  fetchState: () => Promise<void>
  equipOutfit: (outfit: string) => Promise<void>
}

export const useKiwiStore = create<KiwiStoreState>((set) => ({
  xp: 0,
  level: 1,
  outfit: 'default',
  xpProgress: 0,
  xpForNextLevel: 100,
  unlockedOutfits: ['default'],
  mood: 'idle',

  setMood: (mood) => set({ mood }),

  fetchState: async () => {
    try {
      const { state } = await kiwiApi.state()
      set({
        xp: state.xp,
        level: state.level,
        outfit: state.outfit,
        xpProgress: state.xpProgress,
        xpForNextLevel: state.xpForNextLevel,
        unlockedOutfits: state.unlockedOutfits,
      })
    } catch {
      // silently fail
    }
  },

  equipOutfit: async (outfit) => {
    await kiwiApi.equipOutfit(outfit)
    set({ outfit })
  },
}))
