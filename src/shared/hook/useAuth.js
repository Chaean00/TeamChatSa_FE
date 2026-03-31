import { useState, useCallback } from 'react'
import { useAuthStore, setAuthToken, getAuthToken } from '../store/authStore'
import { clearUserCache, prefetchUser } from './useUser'
import { api } from '../api/client'
import { getErrorMessage } from '../lib/errorMessage'

export function useAuth() {
  const { clearAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loginWithEmail = useCallback(async ({ email, password }) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.post('/v1/auth/login', { email, password })

      const token = res.data?.data?.accessToken

      if (!token) {
        throw new Error('토큰이 응답에 없습니다.')
      }
      setAuthToken(token)
      
      // 로그인 성공 후 즉시 사용자 정보를 미리 조회하여 캐싱
      // 이렇게 하면 페이지 이동 후 useUser가 이미 캐시된 데이터를 사용할 수 있음
      prefetchUser().catch(err => {
        // 사용자 정보 조회 실패는 무시 (나중에 다시 시도됨)
        console.warn('로그인 후 사용자 정보 조회 실패:', err)
      })
      
      return true
    } catch (e) {
      setError(getErrorMessage(e, '로그인에 실패했습니다.'))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginWithKakao = useCallback(() => {
    const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const backendOrigin = configuredBaseUrl.endsWith('/api')
      ? configuredBaseUrl.slice(0, -4)
      : configuredBaseUrl
    const currentPath = window.location.pathname
    const redirectPath = currentPath === '/login' || currentPath === '/signup' ? '/' : currentPath
    const state = encodeURIComponent(redirectPath)
    const backendOAuthUrl = `${backendOrigin}/oauth2/authorization/kakao?state=${state}`
    window.location.href = backendOAuthUrl
  }, [])

  const isAuthenticated = Boolean(getAuthToken())
  const logout = useCallback(async ({ skipRequest = false } = {}) => {
    try {
      if (!skipRequest) {
        await api.post('/v1/auth/logout')
      }
    } catch (e) {
      console.error('로그아웃 API 호출 실패:', e)
    } finally {
      // accessToken 삭제 및 사용자 캐시 클리어
      clearAuth()
      clearUserCache()
      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('logoutReason')
          window.sessionStorage.removeItem('authNotice')
        }
      } catch {}
    }
  }, [clearAuth])

  const signupWithEmail = useCallback(async ({ userName, email, password, position, phone }) => {
    setIsLoading(true)
    setError(null)
    try {
      const payload = { userName, email, password, position }
      if (phone) {
        payload.phone = phone
      }

      await api.post('/v1/auth/signup', payload)

      return true
    } catch (e) {
      setError(getErrorMessage(e, '회원가입에 실패했습니다.'))
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { isLoading, error, loginWithEmail, loginWithKakao, signupWithEmail, isAuthenticated, logout }
}

export default useAuth
