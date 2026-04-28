import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '@kiwi/db'
import { authMiddleware } from '../middleware/auth.js'

export const kiwiRoutes = new Hono()

kiwiRoutes.use('*', authMiddleware)

const OUTFITS = ['default', 'focus-hat', 'cozy-scarf', 'party-crown', 'explorer-vest']
const XP_PER_LEVEL = 100

// GET /kiwi — get kiwi state
kiwiRoutes.get('/', async (c) => {
  const { userId } = c.get('user')

  const state = await prisma.kiwiState.findUnique({ where: { userId } })
  if (!state) return c.json({ error: 'Kiwi state not found' }, 404)

  const xpForNextLevel = state.level * XP_PER_LEVEL
  const xpProgress = state.xp % XP_PER_LEVEL

  return c.json({ state: { ...state, xpForNextLevel, xpProgress } })
})

// POST /kiwi/outfit — equip an outfit
kiwiRoutes.post('/outfit', async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()

  const schema = z.object({ outfit: z.enum(OUTFITS as [string, ...string[]]) })
  const result = schema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const state = await prisma.kiwiState.findUnique({ where: { userId } })
  if (!state) return c.json({ error: 'Kiwi state not found' }, 404)

  if (!state.unlockedOutfits.includes(result.data.outfit)) {
    return c.json({ error: 'Outfit not unlocked yet' }, 403)
  }

  const updated = await prisma.kiwiState.update({
    where: { userId },
    data: { outfit: result.data.outfit },
  })

  return c.json({ state: updated })
})

// GET /kiwi/outfits — list all outfits with unlock status
kiwiRoutes.get('/outfits', async (c) => {
  const { userId } = c.get('user')
  const state = await prisma.kiwiState.findUnique({ where: { userId } })

  const outfits = OUTFITS.map((name) => ({
    name,
    unlocked: state?.unlockedOutfits.includes(name) ?? name === 'default',
    equipped: state?.outfit === name,
    unlockLevel: OUTFITS.indexOf(name) * 2,
  }))

  return c.json({ outfits })
})
