import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@kiwi/db'
import { authMiddleware } from '../middleware/auth.js'

export const moodRoutes = new Hono()

moodRoutes.use('*', authMiddleware)

// POST /mood
moodRoutes.post('/', async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()

  const schema = z.object({
    mood: z.number().int().min(1).max(5),
    note: z.string().max(500).optional(),
  })

  const result = schema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const log = await prisma.moodLog.create({
    data: { userId, ...result.data },
  })

  return c.json({ log }, 201)
})

// GET /mood — last 30 days
moodRoutes.get('/', async (c) => {
  const { userId } = c.get('user')
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const logs = await prisma.moodLog.findMany({
    where: { userId, loggedAt: { gte: since } },
    orderBy: { loggedAt: 'desc' },
  })

  return c.json({ logs })
})

// GET /mood/insights
moodRoutes.get('/insights', async (c) => {
  const { userId } = c.get('user')
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const logs = await prisma.moodLog.findMany({
    where: { userId, loggedAt: { gte: since } },
    orderBy: { loggedAt: 'asc' },
  })

  if (!logs.length) return c.json({ insights: [] })

  const avgMood = logs.reduce((s, l) => s + l.mood, 0) / logs.length
  const moodByHour: Record<number, number[]> = {}

  for (const log of logs) {
    const hour = log.loggedAt.getHours()
    if (!moodByHour[hour]) moodByHour[hour] = []
    moodByHour[hour].push(log.mood)
  }

  const bestHour = Object.entries(moodByHour)
    .map(([hour, moods]) => ({ hour: parseInt(hour), avg: moods.reduce((s, m) => s + m, 0) / moods.length }))
    .sort((a, b) => b.avg - a.avg)[0]

  return c.json({
    insights: {
      averageMood: Math.round(avgMood * 10) / 10,
      bestHour: bestHour?.hour,
      totalLogs: logs.length,
    },
  })
})
