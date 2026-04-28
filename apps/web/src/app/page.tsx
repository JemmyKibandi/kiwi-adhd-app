'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/authStore'

export default function RootPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? '/dashboard' : '/login')
    }
  }, [isAuthenticated, isLoading])

  return (
    <div className="min-h-screen bg-kiwi-pale flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🥝</div>
        <p className="text-kiwi-muted text-sm">Loading...</p>
      </div>
    </div>
  )
}
