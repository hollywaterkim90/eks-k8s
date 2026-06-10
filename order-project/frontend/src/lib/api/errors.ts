import axios from 'axios'

// catch 블록의 unknown 에러에서 백엔드 메시지를 안전하게 추출한다.
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? fallback
  }
  return fallback
}

// HTTP 상태 코드를 안전하게 추출한다(없으면 undefined).
export function apiErrorStatus(err: unknown): number | undefined {
  if (axios.isAxiosError(err)) {
    return err.response?.status
  }
  return undefined
}
