import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { getAuthToken, useAuthStore } from '../store/authStore'
import { getErrorMessage } from '../lib/errorMessage'

// 전역 상태로 사용자 정보 캐싱 및 요청 중복 방지
let cachedUser = null
let isLoadingGlobal = false
let loadingPromise = null
let isFetching = false

// 캐시 초기화 함수 (로그아웃 시 사용)
export function clearUserCache() {
  cachedUser = null
  isLoadingGlobal = false
  loadingPromise = null
  isFetching = false
}

// 사용자 정보를 미리 조회하여 캐싱하는 함수 (로그인 후 사용)
export async function prefetchUser() {
  const token = getAuthToken()
  if (!token) {
    return null
  }

  // 이미 요청 중이거나 캐시가 있으면 기존 것 사용
  if (loadingPromise && isFetching) {
    return loadingPromise
  }

  if (cachedUser) {
    return cachedUser
  }

  // 요청 중이 아니면 새로 요청
  if (isFetching) {
    return null
  }

  isFetching = true
  isLoadingGlobal = true

  const promise = (async () => {
    try {
      const res = await api.get('/v1/users')
      const userData = res.data?.data?.data || res.data?.data || res.data
      cachedUser = userData
      return userData
    } catch (e) {
      if (e?.response?.status === 401 || !getAuthToken()) {
        useAuthStore.getState().clearAuth()
        cachedUser = null
        return null
      }
      console.error('사용자 정보 조회 실패:', e)
      return null
    } finally {
      isLoadingGlobal = false
      loadingPromise = null
      isFetching = false
    }
  })()

  loadingPromise = promise
  return promise
}

export function useUser() {
  const token = useAuthStore((state) => state.token)
  const [user, setUser] = useState(cachedUser)
  const [isLoading, setIsLoading] = useState(!cachedUser && isLoadingGlobal)
  const [error, setError] = useState(null)

  const fetchUser = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      setIsLoading(false)
      setUser(null)
      cachedUser = null
      return
    }

    // 이미 요청 중이면 기존 Promise 사용
    if (loadingPromise && isFetching) {
      try {
        const userData = await loadingPromise
        setUser(userData)
        setIsLoading(false)
      } catch (err) {
        setError(getErrorMessage(err, '사용자 정보를 불러오지 못했습니다.'))
        setIsLoading(false)
      }
      return
    }

    // 요청 중이 아니면 새로 요청
    if (isFetching) {
      return
    }

    isFetching = true
    isLoadingGlobal = true

    const promise = (async () => {
      try {
        const res = await api.get('/v1/users')
        // 다양한 응답 구조 지원: { data: {...} }, { data: { data: {...} } }, 또는 직접 {...}
        const userData = res.data?.data?.data || res.data?.data || res.data
        cachedUser = userData
        setUser(userData)
        setError(null)
        return userData
      } catch (e) {
        if (e?.response?.status === 401 || !getAuthToken()) {
          useAuthStore.getState().clearAuth()
          setError(null)
          setUser(null)
          cachedUser = null
          return null
        }
        const errorMessage = getErrorMessage(e, '사용자 정보를 불러오지 못했습니다.')
        setError(errorMessage)
        setUser(null)
        cachedUser = null
        throw new Error(errorMessage)
      } finally {
        setIsLoading(false)
        isLoadingGlobal = false
        loadingPromise = null
        isFetching = false
      }
    })()

    loadingPromise = promise
    return promise
  }, [])

  // refetch 함수: 캐시 무시하고 강제로 새로고침
  const refetch = useCallback(async () => {
    cachedUser = null
    isFetching = false
    loadingPromise = null
    
    const token = getAuthToken()
    if (!token) {
      setUser(null)
      return
    }

    setIsLoading(true)
    isFetching = true
    isLoadingGlobal = true

    try {
      const res = await api.get('/v1/users')
      const userData = res.data?.data?.data || res.data?.data || res.data
      cachedUser = userData
      setUser(userData)
      setError(null)
      return userData
    } catch (e) {
      if (e?.response?.status === 401 || !getAuthToken()) {
        useAuthStore.getState().clearAuth()
        setError(null)
        setUser(null)
        cachedUser = null
        return null
      }
      const errorMessage = getErrorMessage(e, '사용자 정보를 새로고침하지 못했습니다.')
      setError(errorMessage)
      setUser(null)
      cachedUser = null
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
      isLoadingGlobal = false
      isFetching = false
      loadingPromise = null
    }
  }, [])

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      setUser(null)
      cachedUser = null
      return
    }

    // 이미 캐시된 사용자 정보가 있으면 즉시 반환
    if (cachedUser) {
      setUser(cachedUser)
      setIsLoading(false)
      return
    }

    fetchUser()
  }, [fetchUser, token])

  return { user, isLoading, error, refetch }
}
