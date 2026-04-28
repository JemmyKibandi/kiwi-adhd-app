import { create } from 'zustand'
import { authApi, setToken, removeToken, type User } from '../lib/api'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { user, token } = await authApi.login({ email, password })
    setToken(token)
    set({ user, isAuthenticated: true })
  },

  signup: async (email, password, name) => {
    const { user, token } = await authApi.signup({ email, password, name })
    setToken(token)
    set({ user, isAuthenticated: true })
  },

  logout: () => {
    removeToken()
    set({ user: null, isAuthenticated: false })
  },

  loadUser: async () => {
    try {
      const { user } = await authApi.me()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ isLoading: false, isAuthenticated: false })
    }
  },
}))
