'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getProduct } from '@/lib/api/product'
import { apiErrorStatus } from '@/lib/api/errors'
import type { Product } from '@/lib/types'

// ID 단건 조회 화면. 전체 목록은 /products/list 참고.
function ProductLookup() {
  const router = useRouter()
  const [id, setId] = useState('')
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setProduct(null)
    setLoading(true)
    try {
      const { data } = await getProduct(id)
      setProduct(data)
    } catch (err) {
      const status = apiErrorStatus(err)
      if (status === 404 || status === 500) {
        setError('해당 상품을 찾을 수 없습니다.')
      } else {
        setError('상품 조회에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card form-card">
      <Link className="back-link" href="/products/list">← 목록으로 돌아가기</Link>
      <h2>상품 조회</h2>
      <form onSubmit={handleSubmit} className="inline-form">
        <input
          type="number"
          placeholder="상품 ID 입력"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
          min="1"
        />
        <button type="submit" disabled={loading}>
          {loading ? '조회 중...' : '조회'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}

      {product && (
        <div className="product-detail">
          <h3>{product.name}</h3>
          <ul>
            <li>
              <span>상품 ID</span>
              <strong>{product.id}</strong>
            </li>
            <li>
              <span>가격</span>
              <strong>{product.price?.toLocaleString()}원</strong>
            </li>
            <li>
              <span>재고</span>
              <strong>{product.stockQuantity}개</strong>
            </li>
          </ul>
          <button onClick={() => router.push(`/orders/new?productId=${product.id}`)}>
            이 상품 주문하기
          </button>
        </div>
      )}
    </div>
  )
}

export default function ProductLookupPage() {
  return (
    <ProtectedRoute>
      <ProductLookup />
    </ProtectedRoute>
  )
}
