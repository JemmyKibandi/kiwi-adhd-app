import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001'
const TOKEN_KEY = 'kiwi_auth_token'

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error ?? `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// Auth
export const authApi = {
  signup: (data: { email: string; password: string; name?: string }) =>
    api.post<{ user: User; token: string }>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', data),
  me: () => api.get<{ user: User }>('/auth/me'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.patch<{ user: User }>('/auth/me', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ message: string }>('/auth/change-password', data),
}

// Tasks
export const tasksApi = {
  list: (params?: { status?: string; category?: string; date?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : ''
    return api.get<{ tasks: Task[] }>(`/tasks${qs}`)
  },
  create: (data: Partial<Task>) => api.post<{ task: Task }>('/tasks', data),
  get: (id: string) => api.get<{ task: Task }>(`/tasks/${id}`),
  update: (id: string, data: Partial<Task>) => api.patch<{ task: Task }>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/tasks/${id}`),
  addSubtasks: (id: string, subtasks: { title: string }[]) =>
    api.post<{ task: Task }>(`/tasks/${id}/subtasks`, { subtasks }),
  reorder: (tasks: { id: string; order: number }[]) =>
    api.post<{ message: string }>('/tasks/reorder', { tasks }),
}

// Sessions
export const sessionsApi = {
  start: (data: { type?: string; duration: number; taskId?: string }) =>
    api.post<{ session: FocusSession }>('/sessions', data),
  update: (id: string, data: { elapsed?: number; completed?: boolean }) =>
    api.patch<{ session: FocusSession }>(`/sessions/${id}`, data),
  list: () => api.get<{ sessions: FocusSession[]; total: number }>('/sessions'),
  stats: () =>
    api.get<{ todaySessions: number; totalSessions: number; totalFocusMinutes: number }>(
      '/sessions/stats'
    ),
}

// Mood
export const moodApi = {
  log: (data: { mood: number; note?: string }) =>
    api.post<{ log: MoodLog }>('/mood', data),
  list: () => api.get<{ logs: MoodLog[] }>('/mood'),
  insights: () =>
    api.get<{ insights: { averageMood: number; bestHour: number; totalLogs: number } }>(
      '/mood/insights'
    ),
}

// Kiwi
export const kiwiApi = {
  state: () => api.get<{ state: KiwiState & { xpForNextLevel: number; xpProgress: number } }>('/kiwi'),
  equipOutfit: (outfit: string) => api.post<{ state: KiwiState }>('/kiwi/outfit', { outfit }),
  outfits: () =>
    api.get<{ outfits: { name: string; unlocked: boolean; equipped: boolean; unlockLevel: number }[] }>(
      '/kiwi/outfits'
    ),
}

// Routines
export const routinesApi = {
  list: () => api.get<{ routines: Routine[] }>('/routines'),
  create: (data: Partial<Routine>) => api.post<{ routine: Routine }>('/routines', data),
  get: (id: string) => api.get<{ routine: Routine }>(`/routines/${id}`),
  update: (id: string, data: Partial<Routine>) =>
    api.patch<{ routine: Routine }>(`/routines/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/routines/${id}`),
  setSteps: (id: string, steps: RoutineStep[]) =>
    api.post<{ routine: Routine }>(`/routines/${id}/steps`, steps),
}

// Types
export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: string
  kiwiState?: KiwiState
}

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'SNOOZED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  energy: 'LOW' | 'MEDIUM' | 'HIGH'
  category: 'WORK' | 'PERSONAL' | 'HEALTH' | 'LEARNING'
  timeEstimate?: number
  scheduledAt?: string
  completedAt?: string
  order: number
  createdAt: string
  subtasks: Subtask[]
}

export interface Subtask {
  id: string
  taskId: string
  title: string
  completed: boolean
  order: number
}

export interface Routine {
  id: string
  userId: string
  name: string
  type: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'CUSTOM'
  isActive: boolean
  steps: RoutineStep[]
}

export interface RoutineStep {
  id: string
  routineId: string
  name: string
  icon?: string
  duration: number
  order: number
}

export interface FocusSession {
  id: string
  userId: string
  type: 'DEEP_WORK' | 'QUICK_TASK' | 'BREAK'
  duration: number
  elapsed: number
  completed: boolean
  taskId?: string
  startedAt: string
  completedAt?: string
}

export interface MoodLog {
  id: string
  userId: string
  mood: number
  note?: string
  loggedAt: string
}

export interface KiwiState {
  id: string
  userId: string
  xp: number
  level: number
  outfit: string
  streakDays: number
  unlockedOutfits: string[]
  lastActiveAt: string
}
