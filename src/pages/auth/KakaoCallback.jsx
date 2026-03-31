import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { setAuthToken } from '../../shared/store/authStore'
import { prefetchUser } from '../../shared/hook/useUser'
import { getErrorMessage } from '../../shared/lib/errorMessage'

function KakaoCallbackPage() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current) {
      return
    }
    
    hasProcessed.current = true

    const query = new URLSearchParams(search)
    const token = query.get('token') || query.get('accessToken') || query.get('access_token')
    const state = query.get('state')
    const isNewUser = query.get('isNewUser') === 'true'
    const errorParam = query.get('error')

    if (errorParam) {
      setError(errorParam)
      setTimeout(() => navigate('/login', { replace: true }), 2000)
      return
    }

    // 백엔드가 토큰을 직접 전달한 경우 (URL 파라미터로)
    if (token) {
      setAuthToken(token)
      // 로그인 성공 후 즉시 사용자 정보를 미리 조회하여 캐싱
      prefetchUser().catch(err => {
        console.warn('카카오 로그인 후 사용자 정보 조회 실패:', err)
      })

      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('authNotice', isNewUser ? '카카오 인증이 완료되었습니다.' : '카카오 로그인이 완료되었습니다.')
        }
      } catch (storageError) {
        console.warn('카카오 인증 안내 저장 실패:', storageError)
      }

      if (isNewUser) {
        navigate('/auth/kakao/signup', { replace: true })
        return
      }

      const targetPath = state ? decodeURIComponent(state) : '/'
      navigate(targetPath, { replace: true })
      return
    }

    setError(getErrorMessage(null, '카카오 인증 정보를 가져오지 못했습니다.'))
    setTimeout(() => navigate('/login', { replace: true }), 3000)
  }, [search, navigate])

  return (
    <section className="py-20">
      <div className="max-w-sm mx-auto text-center">
        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          <h2 className="text-xl font-semibold">카카오 로그인 처리중…</h2>
          <p className="text-mute text-sm mt-1">잠시만 기다려 주세요.</p>
          {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
        </div>
      </div>
    </section>
  )
}

export default KakaoCallbackPage
