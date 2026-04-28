'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '../../store/authStore'

export default function SignupPage() {
  const router = useRouter()
  const signup = useAuthStore((s) => s.signup)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    try {
      await signup(email.trim().toLowerCase(), password, name.trim())
      router.push('/dashboard')
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-kiwi-pale flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">🥝</div>
          <h1 className="text-3xl font-bold text-kiwi-text">Meet your Kiwi!</h1>
          <p className="text-kiwi-muted mt-1">No judgement, just support 💚</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Your name', value: name, set: setName, type: 'text', placeholder: 'Alex' },
              { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: '8+ characters' },
              { label: 'Confirm password', value: confirm, set: setConfirm, type: 'password', placeholder: '••••••••' },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-semibold text-kiwi-text mb-2">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-kiwi-light bg-kiwi-pale focus:outline-none focus:ring-2 focus:ring-kiwi-primary text-kiwi-text placeholder-kiwi-muted"
                />
              </div>
            ))}

            {error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-kiwi-primary text-white font-bold py-4 rounded-xl hover:bg-kiwi-dark transition-colors disabled:opacity-60 text-base mt-2"
            >
              {loading ? 'Creating account...' : 'Start my journey 🥝'}
            </button>
          </form>

          <p className="text-center text-kiwi-muted text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-kiwi-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
