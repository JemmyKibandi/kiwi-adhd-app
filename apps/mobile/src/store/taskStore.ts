import { create } from 'zustand'
import { tasksApi, type Task } from '../lib/api'

interface TaskState {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  fetchTasks: (params?: { status?: string; category?: string; date?: string }) => Promise<void>
  createTask: (data: Partial<Task>) => Promise<Task>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  completeTask: (id: string) => Promise<void>
  snoozeTask: (id: string) => Promise<void>
  reorderTasks: (tasks: { id: string; order: number }[]) => Promise<void>
  setTasks: (tasks: Task[]) => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const { tasks } = await tasksApi.list(params)
      set({ tasks, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  createTask: async (data) => {
    const { task } = await tasksApi.create(data)
    set((state) => ({ tasks: [task, ...state.tasks] }))
    return task
  },

  updateTask: async (id, data) => {
    const { task } = await tasksApi.update(id, data)
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? task : t)),
    }))
  },

  deleteTask: async (id) => {
    await tasksApi.delete(id)
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
  },

  completeTask: async (id) => {
    await get().updateTask(id, { status: 'DONE' })
  },

  snoozeTask: async (id) => {
    const snoozedUntil = new Date()
    snoozedUntil.setHours(snoozedUntil.getHours() + 1)
    await get().updateTask(id, { status: 'SNOOZED', snoozedUntil: snoozedUntil.toISOString() } as Partial<Task>)
  },

  reorderTasks: async (tasks) => {
    set((state) => {
      const updated = [...state.tasks]
      tasks.forEach(({ id, order }) => {
        const idx = updated.findIndex((t) => t.id === id)
        if (idx !== -1) updated[idx] = { ...updated[idx], order }
      })
      return { tasks: updated.sort((a, b) => a.order - b.order) }
    })
    await tasksApi.reorder(tasks)
  },

  setTasks: (tasks) => set({ tasks }),
}))
