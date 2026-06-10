'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="home">
      <div className="card">
        <h1>주문 시스템 (MSA)</h1>
        <p>member · ordering · product 마이크로서비스를 API 게이트웨이로 연동한 데모 프론트엔드입니다.</p>
        {isAuthenticated ? (
          <div className="home-actions">
            <Link className="action-card" href="/products/lookup">
              <h3>상품 조회</h3>
              <p>상품 ID로 상세 정보를 확인합니다.</p>
            </Link>
            <Link className="action-card" href="/products/list">
              <h3>상품 목록</h3>
              <p>등록된 전체 상품을 확인합니다.</p>
            </Link>
            <Link className="action-card" href="/products/new">
              <h3>상품 등록</h3>
              <p>새로운 상품을 등록합니다.</p>
            </Link>
            <Link className="action-card" href="/orders/new">
              <h3>주문하기</h3>
              <p>상품을 주문합니다.</p>
            </Link>
          </div>
        ) : (
          <div className="home-actions">
            <Link className="action-card" href="/login">
              <h3>로그인</h3>
              <p>서비스를 이용하려면 로그인하세요.</p>
            </Link>
            <Link className="action-card" href="/signup">
              <h3>회원가입</h3>
              <p>계정을 생성합니다.</p>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
