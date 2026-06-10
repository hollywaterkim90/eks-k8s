import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'

interface TokenSet {
  id?: number | string
  token?: string
  refreshToken?: string
}

// 토큰 저장/조회 헬퍼 (localStorage 기반). 브라우저에서만 호출된다.
export const tokenStore = {
  get token(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  },
  get refreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refreshToken')
  },
  get userId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('userId')
  },
  set({ id, token, refreshToken }: TokenSet) {
    if (typeof window === 'undefined') return
    if (id != null) localStorage.setItem('userId', String(id))
    if (token != null) localStorage.setItem('token', token)
    if (refreshToken != null) localStorage.setItem('refreshToken', refreshToken)
  },
  clear() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userId')
  },
}

const client = axios.create({
  baseURL: BASE_URL,
})

// 요청 인터셉터: 모든 요청에 Authorization 헤더 부착.
// 게이트웨이(JwtAuthFilter)가 토큰을 검증한 뒤 X-User-Id 헤더를 백엔드로 주입하므로
// 프론트엔드는 X-User-Id 를 직접 보낼 필요가 없다.
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 재시도 플래그를 포함한 요청 설정 타입
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// 응답 인터셉터: 401 발생 시 refresh-token 으로 access token 재발급 후 1회 재시도.
let refreshing: Promise<string> | null = null

client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined
    const status = error.response?.status

    const isAuthEndpoint =
      original?.url?.includes('/member/doLogin') ||
      original?.url?.includes('/member/refresh-token') ||
      original?.url?.includes('/member/create')

    if (status === 401 && original && !original._retry && !isAuthEndpoint && tokenStore.refreshToken) {
      original._retry = true
      try {
        // 동시에 여러 요청이 401 이 나도 refresh 는 한 번만 수행
        if (!refreshing) {
          refreshing = axios
            .post<{ token: string }>(`${BASE_URL}/member-service/member/refresh-token`, {
              refreshToken: tokenStore.refreshToken,
            })
            .then((r) => r.data.token)
            .finally(() => {
              refreshing = null
            })
        }
        const newToken = await refreshing
        tokenStore.set({ token: newToken })
        original.headers.Authorization = `Bearer ${newToken}`
        return client(original)
      } catch (e) {
        tokenStore.clear()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(e)
      }
    }

    return Promise.reject(error)
  }
)

export default client
