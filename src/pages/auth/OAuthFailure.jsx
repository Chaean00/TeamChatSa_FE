import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Button from '../../shared/ui/Button.jsx'

function OAuthFailurePage() {
  const navigate = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    const query = new URLSearchParams(search)
    const error = query.get('error')
  }, [search])

  return (
    <section className="py-20">
      <div className="max-w-sm mx-auto text-center">
        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          <h2 className="text-xl font-semibold text-ink">로그인 실패</h2>
          <p className="text-mute text-sm mt-2">소셜 로그인 처리 중 오류가 발생했습니다.</p>
          <Button onClick={() => navigate('/login', { replace: true })} className="mt-4">
            로그인 페이지로 돌아가기
          </Button>
        </div>
      </div>
    </section>
  )
}

export default OAuthFailurePage

