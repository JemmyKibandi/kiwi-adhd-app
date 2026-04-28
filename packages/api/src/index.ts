import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth.js'
import { taskRoutes } from './routes/tasks.js'
import { routineRoutes } from './routes/routines.js'
import { sessionRoutes } from './routes/sessions.js'
import { moodRoutes } from './routes/mood.js'
import { kiwiRoutes } from './routes/kiwi.js'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:8081',
      'exp://localhost:8081',
      'http://192.168.1.1:8081', // local network for device testing
    ],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.route('/auth', authRoutes)
app.route('/tasks', taskRoutes)
app.route('/routines', routineRoutes)
app.route('/sessions', sessionRoutes)
app.route('/mood', moodRoutes)
app.route('/kiwi', kiwiRoutes)

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = parseInt(process.env.API_PORT ?? '3001')
console.log(`🥝 Kiwi API running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })

export default app
