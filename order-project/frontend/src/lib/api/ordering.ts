import type { AxiosResponse } from 'axios'
import client from './client'
import type { OrderCreateRequest } from '@/lib/types'

// 주문 생성: POST /ordering-service/ordering/create  { productId, productCount } → 주문 ID
// X-User-Id 는 게이트웨이가 JWT 에서 추출해 주입하므로 프론트엔드는 전송하지 않는다.
export function createOrder({
  productId,
  productCount,
}: OrderCreateRequest): Promise<AxiosResponse<number>> {
  return client.post('/ordering-service/ordering/create', { productId, productCount })
}
