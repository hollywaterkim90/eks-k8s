'use client'

import { useState, useEffect, Suspense, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { createOrder } from '@/lib/api/ordering'
import { getProduct } from '@/lib/api/product'
import { apiErrorMessage, apiErrorStatus } from '@/lib/api/errors'
import type { Product } from '@/lib/types'

function OrderCreate() {
  const searchParams = useSearchParams()
  const [productId, setProductId] = useState(searchParams.get('productId') || '')
  const [productCount, setProductCount] = useState<number | string>(1)
  const [product, setProduct] = useState<Product | null>(null)
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // productId 가 채워지면 상품 정보를 미리 보여준다.
  useEffect(() => {
    if (!productId) {
      setProduct(null)
      return
    }
    let cancelled = false
    getProduct(productId)
      .then(({ data }) => {
        if (!cancelled) setProduct(data)
      })
      .catch(() => {
        if (!cancelled) setProduct(null)
      })
    return () => {
      cancelled = true
    }
  }, [productId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const { data } = await createOrder({
        productId: Number(productId),
        productCount: Number(productCount),
      })
      setResult(data) // 생성된 주문 ID
    } catch (err) {
      const status = apiErrorStatus(err)
      const fallback =
        status != null && status >= 400 ? '재고가 부족하거나 주문에 실패했습니다.' : '주문에 실패했습니다.'
      setError(apiErrorMessage(err, fallback))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card form-card">
      <Link className="back-link" href="/products/list">← 목록으로 돌아가기</Link>
      <h2>주문하기</h2>
      <form onSubmit={handleSubmit}>
        <label>
          상품 ID
          <input
            type="number"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            min="1"
          />
        </label>
        {product && (
          <div className="order-preview">
            <span>{product.name}</span>
            <span>{product.price?.toLocaleString()}원</span>
            <span>재고 {product.stockQuantity}개</span>
          </div>
        )}
        <label>
          주문 수량
          <input
            type="number"
            value={productCount}
            onChange={(e) => setProductCount(e.target.value)}
            required
            min="1"
          />
        </label>
        {error && <p className="error">{error}</p>}
        {result != null && <p className="success">주문 완료! 주문 ID: {result}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '주문 중...' : '주문하기'}
        </button>
      </form>
    </div>
  )
}

export default function OrderCreatePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="card form-card">불러오는 중...</div>}>
        <OrderCreate />
      </Suspense>
    </ProtectedRoute>
  )
}
