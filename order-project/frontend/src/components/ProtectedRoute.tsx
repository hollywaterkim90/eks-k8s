'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

// 클라이언트 사이드 보호 라우트. 인증 상태가 확정(initialized)된 후
// 비로그인 사용자를 /login 으로 보낸다.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, initialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      router.replace('/login')
    }
  }, [initialized, isAuthenticated, router])

  if (!initialized) return null
  if (!isAuthenticated) return null
  return <>{children}</>
}
