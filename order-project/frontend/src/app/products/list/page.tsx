'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { listProducts } from '@/lib/api/product'
import type { Product } from '@/lib/types'

function ProductList() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    setError('')
    listProducts()
      .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setError('상품 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="card">
      <div className="list-header">
        <h2>상품 목록</h2>
        <button className="ghost-button" onClick={load} disabled={loading}>
          새로고침
        </button>
      </div>

      {loading && <p className="hint">불러오는 중...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <p className="hint">등록된 상품이 없습니다. 상품등록 메뉴에서 추가해 보세요.</p>
      )}

      {products.length > 0 && (
        <table className="product-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>상품명</th>
              <th className="num">가격</th>
              <th className="num">재고</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td className="num">{p.price?.toLocaleString()}원</td>
                <td className="num">{p.stockQuantity}개</td>
                <td className="num">
                  <button className="row-button" onClick={() => router.push(`/orders/new?productId=${p.id}`)}>
                    주문
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function ProductListPage() {
  return (
    <ProtectedRoute>
      <ProductList />
    </ProtectedRoute>
  )
}
