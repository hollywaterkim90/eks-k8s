'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signup } from '@/lib/api/member'
import { apiErrorMessage } from '@/lib/api/errors'
import type { SignupRequest } from '@/lib/types'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState<SignupRequest>({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof SignupRequest
    setForm({ ...form, [name]: e.target.value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup(form)
      alert('회원가입이 완료되었습니다. 로그인해 주세요.')
      router.push('/login')
    } catch (err) {
      setError(apiErrorMessage(err, '회원가입에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card form-card">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <label>
          이름
          <input name="name" value={form.name} onChange={onChange} required />
        </label>
        <label>
          이메일
          <input type="email" name="email" value={form.email} onChange={onChange} required />
        </label>
        <label>
          비밀번호
          <input type="password" name="password" value={form.password} onChange={onChange} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '처리 중...' : '회원가입'}
        </button>
      </form>
      <p className="hint">
        이미 계정이 있으신가요? <Link href="/login">로그인</Link>
      </p>
    </div>
  )
}
