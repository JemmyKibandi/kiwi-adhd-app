const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('kiwi_token')
}

export function setToken(token: string) {
  localStorage.setItem('kiwi_token', token)
}

export function removeToken() {
  localStorage.removeItem('kiwi_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
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

// Re-export typed API functions
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', data),
  signup: (data: { email: string; password: string; name?: string }) =>
    api.post<{ user: User; token: string }>('/auth/signup', data),
  me: () => api.get<{ user: User }>('/auth/me'),
}

export const tasksApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return api.get<{ tasks: Task[] }>(`/tasks${qs}`)
  },
  create: (data: Partial<Task>) => api.post<{ task: Task }>('/tasks', data),
  update: (id: string, data: Partial<Task>) => api.patch<{ task: Task }>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/tasks/${id}`),
}

export const sessionsApi = {
  list: () => api.get<{ sessions: FocusSession[]; total: number }>('/sessions'),
  stats: () => api.get<SessionStats>('/sessions/stats'),
}

export const moodApi = {
  list: () => api.get<{ logs: MoodLog[] }>('/mood'),
  insights: () => api.get<{ insights: MoodInsights }>('/mood/insights'),
}

export const kiwiApi = {
  state: () => api.get<{ state: KiwiState & { xpForNextLevel: number; xpProgress: number } }>('/kiwi'),
}

// Types
export interface User {
  id: string; email: string; name?: string; avatar?: string; createdAt: string
  kiwiState?: KiwiState
}
export interface Task {
  id: string; userId: string; title: string; description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'SNOOZED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'; energy: 'LOW' | 'MEDIUM' | 'HIGH'
  category: 'WORK' | 'PERSONAL' | 'HEALTH' | 'LEARNING'
  timeEstimate?: number; scheduledAt?: string; completedAt?: string
  order: number; createdAt: string; subtasks: Subtask[]
}
export interface Subtask { id: string; taskId: string; title: string; completed: boolean; order: number }
export interface FocusSession {
  id: string; userId: string; type: 'DEEP_WORK' | 'QUICK_TASK' | 'BREAK'
  duration: number; elapsed: number; completed: boolean; startedAt: string; completedAt?: string
}
export interface MoodLog { id: string; userId: string; mood: number; note?: string; loggedAt: string }
export interface KiwiState { id: string; xp: number; level: number; outfit: string; streakDays: number; lastActiveAt: string }
export interface SessionStats { todaySessions: number; totalSessions: number; totalFocusMinutes: number }
export interface MoodInsights { averageMood: number; bestHour: number; totalLogs: number }
