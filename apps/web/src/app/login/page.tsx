'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '../../store/authStore'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email.trim().toLowerCase(), password)
      router.push('/dashboard')
    } catch (err) {
      setError((err as Error).message ?? 'Check your email and password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-kiwi-pale flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">🥝</div>
          <h1 className="text-3xl font-bold text-kiwi-text">Welcome back!</h1>
          <p className="text-kiwi-muted mt-1">Kiwi missed you</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-kiwi-text mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-kiwi-light bg-kiwi-pale focus:outline-none focus:ring-2 focus:ring-kiwi-primary text-kiwi-text placeholder-kiwi-muted"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-kiwi-text mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-kiwi-light bg-kiwi-pale focus:outline-none focus:ring-2 focus:ring-kiwi-primary text-kiwi-text placeholder-kiwi-muted"
              />
            </div>

            {error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-kiwi-primary text-white font-bold py-4 rounded-xl hover:bg-kiwi-dark transition-colors disabled:opacity-60 text-base"
            >
              {loading ? 'Signing in...' : "Let's go! →"}
            </button>
          </form>

          <p className="text-center text-kiwi-muted text-sm mt-6">
            New here?{' '}
            <Link href="/signup" className="text-kiwi-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
