import { create } from 'zustand'
import { sessionsApi, type FocusSession } from '../lib/api'

interface SessionState {
  activeSession: FocusSession | null
  sessions: FocusSession[]
  stats: { todaySessions: number; totalSessions: number; totalFocusMinutes: number } | null
  startSession: (type: 'DEEP_WORK' | 'QUICK_TASK' | 'BREAK', durationSecs: number, taskId?: string) => Promise<void>
  updateElapsed: (elapsed: number) => Promise<void>
  completeSession: () => Promise<void>
  cancelSession: () => void
  fetchStats: () => Promise<void>
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  sessions: [],
  stats: null,

  startSession: async (type, durationSecs, taskId) => {
    const { session } = await sessionsApi.start({ type, duration: durationSecs, taskId })
    set({ activeSession: session })
  },

  updateElapsed: async (elapsed) => {
    const { activeSession } = get()
    if (!activeSession) return
    await sessionsApi.update(activeSession.id, { elapsed })
    set({ activeSession: { ...activeSession, elapsed } })
  },

  completeSession: async () => {
    const { activeSession } = get()
    if (!activeSession) return
    const { session } = await sessionsApi.update(activeSession.id, {
      elapsed: activeSession.elapsed,
      completed: true,
    })
    set((state) => ({
      activeSession: null,
      sessions: [session, ...state.sessions],
    }))
    await get().fetchStats()
  },

  cancelSession: () => set({ activeSession: null }),

  fetchStats: async () => {
    try {
      const stats = await sessionsApi.stats()
      set({ stats })
    } catch {
      // silently fail
    }
  },
}))
