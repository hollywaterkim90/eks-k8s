import type { AxiosResponse } from 'axios'
import client from './client'
import type { Product, ProductCreateRequest, UpdateStockRequest } from '@/lib/types'

// 상품 목록 조회: GET /product-service/product/list  → Product[]
// 게이트웨이에서 인증 불필요 경로지만, 토큰이 있으면 함께 전송된다(무해).
export function listProducts(): Promise<AxiosResponse<Product[]>> {
  return client.get('/product-service/product/list')
}

// 상품 상세 조회: GET /product-service/product/{id}  → Product
export function getProduct(id: number | string): Promise<AxiosResponse<Product>> {
  return client.get(`/product-service/product/${id}`)
}

// 상품 등록: POST /product-service/product/create
// 주의: 백엔드 ProductController 가 @RequestBody 가 아닌 모델 바인딩을 사용하므로
//       JSON 이 아니라 application/x-www-form-urlencoded 형식으로 전송해야 한다.
export function createProduct({
  name,
  category,
  price,
  stockQuantity,
}: ProductCreateRequest): Promise<AxiosResponse<number>> {
  const form = new URLSearchParams()
  form.append('name', name)
  form.append('category', category)
  form.append('price', String(price))
  form.append('stockQuantity', String(stockQuantity))
  return client.post('/product-service/product/create', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

// 재고 수정: PUT /product-service/product/updatestock  { productId, productQuantity }
export function updateStock({
  productId,
  productQuantity,
}: UpdateStockRequest): Promise<AxiosResponse<number>> {
  return client.put('/product-service/product/updatestock', { productId, productQuantity })
}
