import type { AxiosResponse } from 'axios'
import client from './client'
import type { LoginRequest, LoginResponse, SignupRequest } from '@/lib/types'

// 회원 가입: POST /member-service/member/create  (인증 불필요)
export function signup({ name, email, password }: SignupRequest): Promise<AxiosResponse<number>> {
  return client.post('/member-service/member/create', { name, email, password })
}

// 로그인: POST /member-service/member/doLogin  → { id, token, refreshToken }
export function login(req: LoginRequest): Promise<AxiosResponse<LoginResponse>> {
  return client.post('/member-service/member/doLogin', req)
}

// access token 재발급: POST /member-service/member/refresh-token  → { token }
export function refreshToken(rt: string): Promise<AxiosResponse<{ token: string }>> {
  return client.post('/member-service/member/refresh-token', { refreshToken: rt })
}
