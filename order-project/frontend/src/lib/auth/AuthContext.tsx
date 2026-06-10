'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { tokenStore } from '@/lib/api/client'
import * as memberApi from '@/lib/api/member'
import type { LoginResponse } from '@/lib/types'

interface AuthContextValue {
  userId: string | null
  isAuthenticated: boolean
  initialized: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // SSR/hydration 안전을 위해 초기값은 null, 마운트 후 localStorage 와 동기화한다.
  const [userId, setUserId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    setUserId(tokenStore.userId)
    setInitialized(true)
  }, [])

  const isAuthenticated = !!userId

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await memberApi.login({ email, password })
    // data = { id, token, refreshToken }
    tokenStore.set(data)
    setUserId(String(data.id))
    return data
  }, [])

  const logout = useCallback(() => {
    tokenStore.clear()
    setUserId(null)
  }, [])

  return (
    <AuthContext.Provider value={{ userId, isAuthenticated, initialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
