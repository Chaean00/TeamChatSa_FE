import axios from "axios";
import { getAuthToken, setAuthToken } from "../store/authStore";

export const api = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api',
  baseURL: "/api",
  withCredentials: true,
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }
  // 개발 환경에서 요청 URL 확인용 (디버깅 후 제거 가능)
  if (import.meta.env.DEV) {
    console.log('[API Request]', {
      baseURL: config.baseURL,
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
    })
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 401 에러이고, 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 토큰 갱신 중이면 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      // baseURL을 상위 스코프에서 선언하여 catch 블록에서도 사용 가능하도록
      const baseURL = api.defaults.baseURL || (import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api')

      try {
        // 토큰 재발급 요청 (인증 없이 호출)
        const res = await axios.post(
          `${baseURL}/v1/auth/reissue`,
          {},
          { withCredentials: true }
        )

        const newAccessToken = res.data?.data?.accessToken
        if (newAccessToken) {
          setAuthToken(newAccessToken)
          processQueue(null, newAccessToken)
          
          // 원래 요청 재시도
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        } else {
          throw new Error('토큰 재발급에 실패했습니다.')
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        // 재발급 실패 시 로그아웃 처리
        const { useAuthStore } = await import('../store/authStore')
        useAuthStore.getState().clearAuth()

        try {
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('logoutReason', 'expired')
          }
        } catch (storageError) {
          console.warn('세션 만료 사유 저장 실패:', storageError)
        }

        // refreshToken 쿠키 삭제를 위해 로그아웃 API 호출
        try {
          await axios.post(
            `${baseURL}/v1/auth/logout`,
            {},
            { withCredentials: true }
          )
        } catch (logoutError) {
          // 로그아웃 API 실패해도 무시 (이미 클라이언트 상태는 정리됨)
          console.warn('로그아웃 API 호출 실패:', logoutError)
        }
        
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)