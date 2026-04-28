import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@kiwi/db'
import { authMiddleware } from '../middleware/auth.js'

export const taskRoutes = new Hono()

taskRoutes.use('*', authMiddleware)

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'SNOOZED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  energy: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  category: z.enum(['WORK', 'PERSONAL', 'HEALTH', 'LEARNING']).optional(),
  timeEstimate: z.number().int().positive().optional(),
  scheduledAt: z.string().datetime().optional(),
  snoozedUntil: z.string().datetime().optional(),
  order: z.number().int().optional(),
})

// GET /tasks
taskRoutes.get('/', async (c) => {
  const { userId } = c.get('user')
  const { status, category, date } = c.req.query()

  const where: Record<string, unknown> = { userId }
  if (status) where.status = status
  if (category) where.category = category
  if (date) {
    const d = new Date(date)
    const nextDay = new Date(d)
    nextDay.setDate(nextDay.getDate() + 1)
    where.scheduledAt = { gte: d, lt: nextDay }
  }

  const tasks = await prisma.task.findMany({
    where,
    include: { subtasks: { orderBy: { order: 'asc' } } },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })

  return c.json({ tasks })
})

// POST /tasks
taskRoutes.post('/', async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()
  const result = taskSchema.safeParse(body)

  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const task = await prisma.task.create({
    data: { userId, ...result.data },
    include: { subtasks: true },
  })

  return c.json({ task }, 201)
})

// GET /tasks/:id
taskRoutes.get('/:id', async (c) => {
  const { userId } = c.get('user')
  const task = await prisma.task.findFirst({
    where: { id: c.req.param('id'), userId },
    include: { subtasks: { orderBy: { order: 'asc' } } },
  })
  if (!task) return c.json({ error: 'Task not found' }, 404)
  return c.json({ task })
})

// PATCH /tasks/:id
taskRoutes.patch('/:id', async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()
  const result = taskSchema.partial().safeParse(body)

  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const existing = await prisma.task.findFirst({ where: { id: c.req.param('id'), userId } })
  if (!existing) return c.json({ error: 'Task not found' }, 404)

  const data: Record<string, unknown> = { ...result.data }
  if (result.data.status === 'DONE' && existing.status !== 'DONE') {
    data.completedAt = new Date()
  }

  const task = await prisma.task.update({
    where: { id: c.req.param('id') },
    data,
    include: { subtasks: true },
  })

  // Award XP for task completion
  if (result.data.status === 'DONE' && existing.status !== 'DONE') {
    await prisma.kiwiState.update({
      where: { userId },
      data: {
        xp: { increment: 10 },
        lastActiveAt: new Date(),
      },
    })
  }

  return c.json({ task })
})

// DELETE /tasks/:id
taskRoutes.delete('/:id', async (c) => {
  const { userId } = c.get('user')
  const existing = await prisma.task.findFirst({ where: { id: c.req.param('id'), userId } })
  if (!existing) return c.json({ error: 'Task not found' }, 404)
  await prisma.task.delete({ where: { id: c.req.param('id') } })
  return c.json({ message: 'Task deleted' })
})

// POST /tasks/:id/subtasks
taskRoutes.post('/:id/subtasks', async (c) => {
  const { userId } = c.get('user')
  const task = await prisma.task.findFirst({ where: { id: c.req.param('id'), userId } })
  if (!task) return c.json({ error: 'Task not found' }, 404)

  const body = await c.req.json()
  const schema = z.object({
    subtasks: z.array(z.object({ title: z.string().min(1), order: z.number().int().optional() })),
  })
  const result = schema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  await prisma.subtask.createMany({
    data: result.data.subtasks.map((s, i) => ({
      taskId: task.id,
      title: s.title,
      order: s.order ?? i,
    })),
  })

  const updated = await prisma.task.findUnique({
    where: { id: task.id },
    include: { subtasks: { orderBy: { order: 'asc' } } },
  })

  return c.json({ task: updated }, 201)
})

// PATCH /tasks/:id/subtasks/:subtaskId
taskRoutes.patch('/:id/subtasks/:subtaskId', async (c) => {
  const { userId } = c.get('user')
  const task = await prisma.task.findFirst({ where: { id: c.req.param('id'), userId } })
  if (!task) return c.json({ error: 'Task not found' }, 404)

  const body = await c.req.json()
  const schema = z.object({ completed: z.boolean().optional(), title: z.string().optional() })
  const result = schema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const subtask = await prisma.subtask.update({
    where: { id: c.req.param('subtaskId') },
    data: result.data,
  })

  return c.json({ subtask })
})

// POST /tasks/reorder — bulk reorder
taskRoutes.post('/reorder', async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()
  const schema = z.object({
    tasks: z.array(z.object({ id: z.string(), order: z.number().int() })),
  })
  const result = schema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  await Promise.all(
    result.data.tasks.map((t) =>
      prisma.task.updateMany({ where: { id: t.id, userId }, data: { order: t.order } })
    )
  )

  return c.json({ message: 'Tasks reordered' })
})
