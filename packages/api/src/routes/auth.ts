import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@kiwi/db'
import { signToken } from '../lib/jwt.js'
import { authMiddleware } from '../middleware/auth.js'

export const authRoutes = new Hono()

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// POST /auth/signup
authRoutes.post('/signup', async (c) => {
  const body = await c.req.json()
  const result = signupSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten().fieldErrors }, 400)
  }

  const { email, password, name } = result.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return c.json({ error: 'Email already in use' }, 409)
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      kiwiState: {
        create: { xp: 0, level: 1 },
      },
    },
    select: { id: true, email: true, name: true, createdAt: true },
  })

  const token = signToken({ userId: user.id, email: user.email })

  return c.json({ user, token }, 201)
})

// POST /auth/login
authRoutes.post('/login', async (c) => {
  const body = await c.req.json()
  const result = loginSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.flatten().fieldErrors }, 400)
  }

  const { email, password } = result.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = signToken({ userId: user.id, email: user.email })

  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  })
})

// GET /auth/me
authRoutes.get('/me', authMiddleware, async (c) => {
  const { userId } = c.get('user')

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      createdAt: true,
      kiwiState: true,
    },
  })

  if (!user) return c.json({ error: 'User not found' }, 404)

  return c.json({ user })
})

// PATCH /auth/me — update profile
authRoutes.patch('/me', authMiddleware, async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()

  const schema = z.object({
    name: z.string().min(1).optional(),
    avatar: z.string().url().optional(),
  })

  const result = schema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const user = await prisma.user.update({
    where: { id: userId },
    data: result.data,
    select: { id: true, email: true, name: true, avatar: true },
  })

  return c.json({ user })
})

// POST /auth/change-password
authRoutes.post('/change-password', authMiddleware, async (c) => {
  const { userId } = c.get('user')
  const body = await c.req.json()

  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  })

  const result = schema.safeParse(body)
  if (!result.success) return c.json({ error: result.error.flatten() }, 400)

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const valid = await bcrypt.compare(result.data.currentPassword, user.password)
  if (!valid) return c.json({ error: 'Current password is incorrect' }, 400)

  const hashed = await bcrypt.hash(result.data.newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

  return c.json({ message: 'Password updated successfully' })
})
