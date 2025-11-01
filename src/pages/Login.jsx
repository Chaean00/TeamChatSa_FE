import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../shared/hook/useAuth'
import Button from '../shared/ui/Button.jsx'

function LoginPage() {
  const navigate = useNavigate()
  const { isLoading, error, loginWithEmail, loginWithKakao } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    const ok = await loginWithEmail({ email, password })
    if (ok) {
      navigate('/', { replace: true })
    }
  }

  const onKakaoLogin = () => {
    loginWithKakao()
  }

  return (
    <section className="py-14 sm:py-20">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          <h2 className="text-2xl font-semibold text-ink">로그인</h2>
          <p className="text-mute text-sm mt-1">계정으로 계속 진행하세요.</p>

          <form onSubmit={onSubmit} className="grid gap-3 mt-6">
            <label className="grid gap-1">
              <span className="text-sm text-mute">이메일</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-mute">비밀번호</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>

            <Button type="submit" disabled={isLoading} className="mt-2">
              이메일로 로그인
            </Button>
          </form>

          {error && (
            <p className="text-red-600 mt-2 text-sm">{error}</p>
          )}

          <div className="my-5 h-px bg-gray-100" />

          <button onClick={onKakaoLogin} className="w-full bg-[#FEE500] hover:brightness-95 text-ink rounded-xl px-3 py-2 text-sm font-medium">
            카카오로 시작하기
          </button>
        </div>
        <p className="text-center text-[12px] text-mute mt-3">계정이 없으신가요? <Link to="/signup" className="text-primary-600">회원가입</Link></p>
      </div>
    </section>
  )
}

export default LoginPage

