'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { apiErrorMessage } from '@/lib/api/errors'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('admin@naver.com')
  const [password, setPassword] = useState('12341234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/')
    } catch (err) {
      setError(apiErrorMessage(err, '이메일 또는 비밀번호가 일치하지 않습니다.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card form-card">
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        <label>
          이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <p className="hint">
        계정이 없으신가요? <Link href="/signup">회원가입</Link>
      </p>
      <p className="hint">기본 관리자 계정: admin@naver.com / 12341234</p>
    </div>
  )
}
