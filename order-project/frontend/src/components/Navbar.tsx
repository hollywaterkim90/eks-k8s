'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

export default function Navbar() {
  const { isAuthenticated, userId, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link href="/">🛒 Order System</Link>
      </div>
      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <Link href="/products/lookup">상품조회</Link>
            <Link href="/products/list">상품목록</Link>
            <Link href="/products/new">상품등록</Link>
            <Link href="/orders/new">주문하기</Link>
            <span className="navbar-user">ID: {userId}</span>
            <button className="link-button" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link href="/login">로그인</Link>
            <Link href="/signup">회원가입</Link>
          </>
        )}
      </div>
    </nav>
  )
}
