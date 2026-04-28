import { create } from 'zustand'
import { authApi, setToken, removeToken, type User } from '../lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { user, token } = await authApi.login({ email, password })
    await setToken(token)
    set({ user, token, isAuthenticated: true })
  },

  signup: async (email, password, name) => {
    const { user, token } = await authApi.signup({ email, password, name })
    await setToken(token)
    set({ user, token, isAuthenticated: true })
  },

  logout: async () => {
    await removeToken()
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadUser: async () => {
    try {
      const { user } = await authApi.me()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  updateUser: (data) =>
    set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
}))
