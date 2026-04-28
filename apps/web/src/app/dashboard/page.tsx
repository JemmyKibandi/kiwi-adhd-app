'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { useAuthStore } from '../../store/authStore'
import { tasksApi, sessionsApi, moodApi, kiwiApi, type Task, type FocusSession, type MoodLog } from '../../lib/api'

const CATEGORY_COLORS: Record<string, string> = {
  WORK: '#3B82F6', PERSONAL: '#8B5CF6', HEALTH: '#EC4899', LEARNING: '#F97316',
}

function StatCard({ emoji, label, value, sub }: { emoji: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="text-3xl font-bold text-kiwi-text">{value}</div>
      <div className="text-sm font-semibold text-kiwi-text mt-1">{label}</div>
      {sub && <div className="text-xs text-kiwi-muted mt-1">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, loadUser, logout } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([])
  const [kiwiState, setKiwiState] = useState<{ xp: number; level: number; xpProgress: number; xpForNextLevel: number } | null>(null)
  const [stats, setStats] = useState<{ todaySessions: number; totalSessions: number; totalFocusMinutes: number } | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
      return
    }
    if (isAuthenticated) loadDashboard()
  }, [isAuthenticated, isLoading])

  const loadDashboard = async () => {
    try {
      const [t, s, m, k, st] = await Promise.all([
        tasksApi.list(),
        sessionsApi.list(),
        moodApi.list(),
        kiwiApi.state(),
        sessionsApi.stats(),
      ])
      setTasks(t.tasks)
      setSessions(s.sessions)
      setMoodLogs(m.logs)
      setKiwiState(k.state)
      setStats(st)
    } catch (e) {
      console.error(e)
    } finally {
      setDataLoading(false)
    }
  }

  // Derived analytics
  const doneTasks = tasks.filter((t) => t.status === 'DONE')
  const activeTasks = tasks.filter((t) => t.status !== 'DONE')
  const tasksByCategory = Object.entries(CATEGORY_COLORS).map(([cat, color]) => ({
    name: cat,
    value: tasks.filter((t) => t.category === cat).length,
    color,
  })).filter((c) => c.value > 0)

  // Focus sessions last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const daySessions = sessions.filter((s) =>
      s.startedAt.startsWith(dateStr) && s.completed
    )
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      sessions: daySessions.length,
      minutes: Math.round(daySessions.reduce((acc, s) => acc + s.elapsed, 0) / 60),
    }
  })

  // Mood last 7 days
  const moodData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const dayLogs = moodLogs.filter((l) => l.loggedAt.startsWith(dateStr))
    const avg = dayLogs.length ? dayLogs.reduce((a, l) => a + l.mood, 0) / dayLogs.length : null
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      mood: avg ? Math.round(avg * 10) / 10 : null,
    }
  })

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-kiwi-pale flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🥝</div>
          <p className="text-kiwi-muted">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kiwi-pale">
      {/* Nav */}
      <nav className="bg-white border-b border-kiwi-light sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥝</span>
            <span className="text-xl font-bold text-kiwi-text">Kiwi Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-kiwi-muted">Hi, {user?.name ?? user?.email} 👋</span>
            <button
              onClick={() => { logout(); router.push('/login') }}
              className="text-sm text-kiwi-muted hover:text-kiwi-text transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-kiwi-text">Your overview</h1>
          <p className="text-kiwi-muted mt-1">Progress over perfection, always ✨</p>
        </div>

        {/* Kiwi level card */}
        {kiwiState && (
          <div className="bg-gradient-to-r from-kiwi-primary to-kiwi-dark rounded-2xl p-6 mb-8 text-white flex items-center gap-6">
            <div className="text-5xl">🥝</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl font-bold">Level {kiwiState.level} Kiwi</span>
                <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">{kiwiState.xp} XP total</span>
              </div>
              <div className="bg-white/20 rounded-full h-2 w-full max-w-xs">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-1000"
                  style={{ width: `${(kiwiState.xpProgress / kiwiState.xpForNextLevel) * 100}%` }}
                />
              </div>
              <div className="text-sm text-white/80 mt-1">
                {kiwiState.xpProgress}/{kiwiState.xpForNextLevel} XP to level {kiwiState.level + 1}
              </div>
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard emoji="✅" label="Tasks done" value={doneTasks.length} sub={`${activeTasks.length} active`} />
          <StatCard emoji="⏱️" label="Focus sessions" value={stats?.totalSessions ?? 0} sub={`${stats?.todaySessions ?? 0} today`} />
          <StatCard emoji="🧠" label="Focus time" value={`${stats?.totalFocusMinutes ?? 0}m`} sub="total" />
          <StatCard emoji="📊" label="Active tasks" value={activeTasks.length} sub={`${tasks.length} total`} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Focus sessions chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-kiwi-text mb-1">Focus sessions</h2>
            <p className="text-sm text-kiwi-muted mb-4">Last 7 days</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last7} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#C8E6A0" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A7A7A' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A7A7A' }} />
                <Tooltip
                  contentStyle={{ background: '#FDF6EC', border: '1px solid #C8E6A0', borderRadius: 12 }}
                  formatter={(v: number) => [`${v} sessions`, 'Sessions']}
                />
                <Bar dataKey="sessions" fill="#7CB518" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mood chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-kiwi-text mb-1">Mood pattern</h2>
            <p className="text-sm text-kiwi-muted mb-4">Last 7 days (1–5 scale)</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={moodData}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7CB518" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7CB518" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#C8E6A0" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A7A7A' }} />
                <YAxis domain={[1, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7A7A7A' }} />
                <Tooltip
                  contentStyle={{ background: '#FDF6EC', border: '1px solid #C8E6A0', borderRadius: 12 }}
                  formatter={(v: number) => [v ? `${v}/5` : 'No data', 'Mood']}
                />
                <Area type="monotone" dataKey="mood" stroke="#7CB518" strokeWidth={2} fill="url(#moodGradient)" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks by category */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-kiwi-text mb-4">Tasks by category</h2>
            {tasksByCategory.length === 0 ? (
              <div className="text-center py-8 text-kiwi-muted">No tasks yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={tasksByCategory} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {tasksByCategory.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#FDF6EC', border: '1px solid #C8E6A0', borderRadius: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {tasksByCategory.map((c) => (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-kiwi-muted">{c.name} ({c.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recent tasks */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-kiwi-text mb-4">Recent tasks</h2>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-kiwi-muted">No tasks yet — open the mobile app to add some!</div>
            ) : (
              <div className="space-y-3">
                {tasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-kiwi-pale transition-colors">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[task.category] }}
                    />
                    <span className={`flex-1 text-sm font-medium ${task.status === 'DONE' ? 'line-through text-kiwi-muted' : 'text-kiwi-text'}`}>
                      {task.title}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-kiwi-pale text-kiwi-muted'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
