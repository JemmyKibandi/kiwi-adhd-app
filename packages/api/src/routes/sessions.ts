import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@kiwi/db'
import { authMiddleware } from '../middleware/auth.js'

export const sessionRoutes = new Hono()

sessionRoutes.use('*', authMiddleware)

// POST /sessions — start a session
sessionRoutes.post('/', async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()

  const schema = z.object({
    type: z.enum(['DEEP_WORK', 'QUICK_TASK', 'BREAK']).optional(),
    duration: z.number().int().positive(), // seconds
    taskId: z.string().optional(),
  })

  const result = schema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const session = await prisma.focusSession.create({
    data: { userId, ...result.data },
  })

  return c.json({ session }, 201)
})

// PATCH /sessions/:id — update (complete or update elapsed)
sessionRoutes.patch('/:id', async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()

  const schema = z.object({
    elapsed: z.number().int().min(0).optional(),
    completed: z.boolean().optional(),
  })

  const result = schema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const existing = await prisma.focusSession.findFirst({
    where: { id: c.req.param('id'), userId },
  })
  if (!existing) return c.json({ error: 'Session not found' }, 404)

  const data: Record<string, unknown> = { ...result.data }
  if (result.data.completed) data.completedAt = new Date()

  const session = await prisma.focusSession.update({
    where: { id: c.req.param('id') },
    data,
  })

  // Award XP for completing a focus session
  if (result.data.completed && !existing.completed) {
    const xpGain = session.type === 'DEEP_WORK' ? 25 : session.type === 'QUICK_TASK' ? 10 : 5
    const current = await prisma.kiwiState.findUnique({ where: { userId } })
    const newXp = (current?.xp ?? 0) + xpGain
    const newLevel = Math.floor(newXp / 100) + 1

    await prisma.kiwiState.update({
      where: { userId },
      data: { xp: newXp, level: newLevel, lastActiveAt: new Date() },
    })
  }

  return c.json({ session })
})

// GET /sessions — list sessions
sessionRoutes.get('/', async (c) => {
  const { userId } = c.get('user')
  const { limit = '20', offset = '0' } = c.req.query()

  const sessions = await prisma.focusSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: parseInt(limit),
    skip: parseInt(offset),
  })

  const total = await prisma.focusSession.count({ where: { userId } })

  return c.json({ sessions, total })
})

// GET /sessions/stats
sessionRoutes.get('/stats', async (c) => {
  const { userId } = c.get('user')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todaySessions, totalSessions, totalFocusTime] = await Promise.all([
    prisma.focusSession.count({ where: { userId, startedAt: { gte: today }, completed: true } }),
    prisma.focusSession.count({ where: { userId, completed: true } }),
    prisma.focusSession.aggregate({
      where: { userId, completed: true },
      _sum: { elapsed: true },
    }),
  ])

  return c.json({
    todaySessions,
    totalSessions,
    totalFocusMinutes: Math.floor((totalFocusTime._sum.elapsed ?? 0) / 60),
  })
})
