'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { createProduct } from '@/lib/api/product'
import { apiErrorMessage } from '@/lib/api/errors'

interface ProductForm {
  name: string
  category: string
  price: string
  stockQuantity: string
}

function ProductCreate() {
  const [form, setForm] = useState<ProductForm>({ name: '', category: '', price: '', stockQuantity: '' })
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof ProductForm
    setForm({ ...form, [name]: e.target.value })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const { data } = await createProduct({
        name: form.name,
        category: form.category,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
      })
      setResult(data) // 생성된 상품 ID
      setForm({ name: '', category: '', price: '', stockQuantity: '' })
    } catch (err) {
      setError(apiErrorMessage(err, '상품 등록에 실패했습니다. (권한이 필요할 수 있습니다)'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card form-card">
      <Link className="back-link" href="/products/list">← 목록으로 돌아가기</Link>
      <h2>상품 등록</h2>
      <form onSubmit={handleSubmit}>
        <label>
          상품명
          <input name="name" value={form.name} onChange={onChange} required />
        </label>
        <label>
          카테고리
          <input name="category" value={form.category} onChange={onChange} required />
        </label>
        <label>
          가격
          <input type="number" name="price" value={form.price} onChange={onChange} required min="0" />
        </label>
        <label>
          재고 수량
          <input
            type="number"
            name="stockQuantity"
            value={form.stockQuantity}
            onChange={onChange}
            required
            min="0"
          />
        </label>
        {error && <p className="error">{error}</p>}
        {result != null && <p className="success">등록 완료! 생성된 상품 ID: {result}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '등록 중...' : '상품 등록'}
        </button>
      </form>
    </div>
  )
}

export default function ProductCreatePage() {
  return (
    <ProtectedRoute>
      <ProductCreate />
    </ProtectedRoute>
  )
}
