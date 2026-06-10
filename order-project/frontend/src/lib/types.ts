// 백엔드 DTO 와 매핑되는 공용 타입 정의

export interface Product {
  id: number
  name: string
  price: number
  stockQuantity: number
}

export interface SignupRequest {
  name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  id: number
  token: string
  refreshToken: string
}

export interface ProductCreateRequest {
  name: string
  category: string
  price: number
  stockQuantity: number
}

export interface UpdateStockRequest {
  productId: number
  productQuantity: number
}

export interface OrderCreateRequest {
  productId: number
  productCount: number
}
