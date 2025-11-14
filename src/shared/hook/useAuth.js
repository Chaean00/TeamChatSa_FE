import { useState, useCallback } from 'react'
import { useAuthStore, setAuthToken, getAuthToken } from '../store/authStore'
import { clearUserCache } from './useUser'
import { api } from '../api/client'

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
      
      return true
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '로그인에 실패했습니다.'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginWithKakao = useCallback(() => {
    // 백엔드의 Spring Security OAuth2 엔드포인트 사용
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
    const state = encodeURIComponent(window.location.pathname)
    
    // 백엔드가 처리하는 카카오 OAuth 엔드포인트로 리다이렉트
    const backendOAuthUrl = `${apiBaseUrl}/oauth2/authorization/kakao?state=${state}`
    window.location.href = backendOAuthUrl
  }, [])

  const isAuthenticated = Boolean(getAuthToken())
  const logout = useCallback(async () => {
    try {
      // refreshToken 삭제를 위한 로그아웃 API 호출
      await api.post('/v1/auth/logout')
    } catch (e) {
      // 로그아웃 API 실패해도 클라이언트에서는 로그아웃 처리
      console.error('로그아웃 API 호출 실패:', e)
    } finally {
      // accessToken 삭제 및 사용자 캐시 클리어
      clearAuth()
      clearUserCache()
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

      const res = await api.post('/v1/auth/signup', payload)

      return true
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '회원가입에 실패했습니다.'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { isLoading, error, loginWithEmail, loginWithKakao, signupWithEmail, isAuthenticated, logout }
}

export default useAuth

