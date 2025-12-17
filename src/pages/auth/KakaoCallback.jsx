import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { setAuthToken } from '../../shared/store/authStore'
import { prefetchUser } from '../../shared/hook/useUser'

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
    const code = query.get('code')
    const token = query.get('token') || query.get('accessToken') || query.get('access_token')
    const state = query.get('state')
    const errorParam = query.get('error')

    if (errorParam) {
      setError(`카카오 로그인 오류: ${errorParam}`)
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
      alert('카카오 로그인이 완료되었습니다.')
      const targetPath = state ? decodeURIComponent(state) : '/'
      navigate(targetPath, { replace: true })
      return
    }

    // 코드가 없는 경우 (이미 처리되었거나 오류)
    if (!code) {
      setError('인가 코드가 없습니다.')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
      return
    }

    // 코드가 있는 경우 - 백엔드에 토큰 교환 요청
    ;(async () => {
      try {
        const res = await api.post('/auth/kakao/callback', { code, state })
        const receivedToken = res?.data?.token || res?.data?.accessToken || res?.data?.access_token
        if (!receivedToken) {
          throw new Error('토큰이 응답에 없습니다.')
        }
        
        setAuthToken(receivedToken)
        
        // 로그인 성공 후 즉시 사용자 정보를 미리 조회하여 캐싱
        prefetchUser().catch(err => {
          console.warn('카카오 로그인 후 사용자 정보 조회 실패:', err)
        })
        
        // 성공 메시지 표시 (회원가입인지 로그인인지 확인)
        const isNewUser = res?.data?.isNewUser ?? res?.data?.newUser ?? false
        const message = isNewUser 
          ? '카카오 회원가입이 완료되었습니다.' 
          : '카카오 로그인이 완료되었습니다.'
        alert(message)
        
        const targetPath = state ? decodeURIComponent(state) : '/'
        navigate(targetPath, { replace: true })
      } catch (e) {
        let errorMessage = '로그인 처리에 실패했습니다.'
        if (e.response) {
          errorMessage = `서버 오류 (${e.response.status}): ${e.response.data?.message || e.response.statusText}`
        } else if (e.request) {
          errorMessage = '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.'
        } else {
          errorMessage = e.message || '알 수 없는 오류가 발생했습니다.'
        }
        
        setError(errorMessage)
        setTimeout(() => navigate('/login', { replace: true }), 3000)
      }
    })()
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

