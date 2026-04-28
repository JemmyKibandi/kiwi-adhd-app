import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@kiwi/db'
import { authMiddleware } from '../middleware/auth.js'

export const routineRoutes = new Hono()

routineRoutes.use('*', authMiddleware)

const stepSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  duration: z.number().int().positive(),
  order: z.number().int().optional(),
})

const routineSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'CUSTOM']).optional(),
  isActive: z.boolean().optional(),
  steps: z.array(stepSchema).optional(),
})

// GET /routines
routineRoutes.get('/', async (c) => {
  const { userId } = c.get('user')
  const routines = await prisma.routine.findMany({
    where: { userId },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return c.json({ routines })
})

// POST /routines
routineRoutes.post('/', async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()
  const result = routineSchema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const { steps, ...routineData } = result.data
  const routine = await prisma.routine.create({
    data: {
      userId,
      ...routineData,
      steps: steps ? { create: steps.map((s, i) => ({ ...s, order: s.order ?? i })) } : undefined,
    },
    include: { steps: { orderBy: { order: 'asc' } } },
  })

  return c.json({ routine }, 201)
})

// GET /routines/:id
routineRoutes.get('/:id', async (c) => {
  const { userId } = c.get('user')
  const routine = await prisma.routine.findFirst({
    where: { id: c.req.param('id'), userId },
    include: { steps: { orderBy: { order: 'asc' } } },
  })
  if (!routine) return c.json({ error: 'Routine not found' }, 404)
  return c.json({ routine })
})

// PATCH /routines/:id
routineRoutes.patch('/:id', async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()
  const result = routineSchema.partial().safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const existing = await prisma.routine.findFirst({ where: { id: c.req.param('id'), userId } })
  if (!existing) return c.json({ error: 'Routine not found' }, 404)

  const { steps, ...routineData } = result.data
  const routine = await prisma.routine.update({
    where: { id: c.req.param('id') },
    data: routineData,
    include: { steps: { orderBy: { order: 'asc' } } },
  })

  return c.json({ routine })
})

// DELETE /routines/:id
routineRoutes.delete('/:id', async (c) => {
  const { userId } = c.get('user')
  const existing = await prisma.routine.findFirst({ where: { id: c.req.param('id'), userId } })
  if (!existing) return c.json({ error: 'Routine not found' }, 404)
  await prisma.routine.delete({ where: { id: c.req.param('id') } })
  return c.json({ message: 'Routine deleted' })
})

// POST /routines/:id/steps — replace steps
routineRoutes.post('/:id/steps', async (c) => {
  const { userId } = c.get('user')
  const routine = await prisma.routine.findFirst({ where: { id: c.req.param('id'), userId } })
  if (!routine) return c.json({ error: 'Routine not found' }, 404)

  const body = await c.req.json()
  const result = z.array(stepSchema).safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  await prisma.routineStep.deleteMany({ where: { routineId: routine.id } })
  await prisma.routineStep.createMany({
    data: result.data.map((s, i) => ({ routineId: routine.id, ...s, order: s.order ?? i })),
  })

  const updated = await prisma.routine.findUnique({
    where: { id: routine.id },
    include: { steps: { orderBy: { order: 'asc' } } },
  })

  return c.json({ routine: updated })
})
