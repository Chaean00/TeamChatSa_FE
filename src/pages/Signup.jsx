import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../shared/hook/useAuth'
import Button from '../shared/ui/Button.jsx'

function SignupPage() {
  const navigate = useNavigate()
  const { signupWithEmail, isLoading, error } = useAuth()
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [position, setPosition] = useState('')
  const [phone, setPhone] = useState('')

  const positions = [
    { value: 'GK', label: 'GK - 골키퍼' },
    { value: 'CB', label: 'CB - 센터백' },
    { value: 'LCB', label: 'LCB - 왼쪽 센터백' },
    { value: 'RCB', label: 'RCB - 오른쪽 센터백' },
    { value: 'LB', label: 'LB - 왼쪽 풀백' },
    { value: 'RB', label: 'RB - 오른쪽 풀백' },
    { value: 'LWB', label: 'LWB - 왼쪽 윙백' },
    { value: 'RWB', label: 'RWB - 오른쪽 윙백' },
    { value: 'CDM', label: 'CDM - 수비형 미드필더' },
    { value: 'CM', label: 'CM - 중앙 미드필더' },
    { value: 'CAM', label: 'CAM - 공격형 미드필더' },
    { value: 'LM', label: 'LM - 왼쪽 미드필더' },
    { value: 'RM', label: 'RM - 오른쪽 미드필더' },
    { value: 'LW', label: 'LW - 왼쪽 윙어' },
    { value: 'RW', label: 'RW - 오른쪽 윙어' },
    { value: 'CF', label: 'CF - 중앙 공격수' },
    { value: 'LF', label: 'LF - 왼쪽 공격수' },
    { value: 'RF', label: 'RF - 오른쪽 공격수' },
    { value: 'ST', label: 'ST - 스트라이커' },
    { value: 'LS', label: 'LS - 왼쪽 스트라이커' },
    { value: 'RS', label: 'RS - 오른쪽 스트라이커' },
    { value: 'ALL', label: 'ALL - 모든 포지션' }
  ]

  const onSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }
    const ok = await signupWithEmail({ 
      userName, 
      email, 
      password, 
      position,
      phone: phone || undefined 
    })
    if (ok) {
      alert('회원가입이 완료되었습니다.')
      navigate('/login', { replace: true })
    } else {
      alert(error)
    }
  }

  return (
    <section className="py-14 sm:py-20">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          <h2 className="text-2xl font-semibold text-ink">회원가입</h2>
          <p className="text-mute text-sm mt-1">간단한 정보만 입력하면 바로 시작할 수 있어요.</p>

          <form onSubmit={onSubmit} className="grid gap-3 mt-6">
            <label className="grid gap-1">
              <span className="text-sm text-mute">이름</span>
              <input
                type="text"
                placeholder="홍길동"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>
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
                minLength={8}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <p className="text-xs text-mute mt-0.5">비밀번호는 8글자 이상 작성해주세요.</p>
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-mute">비밀번호 확인</span>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-mute">선호 포지션 <span className="text-red-500">*</span></span>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">선택해주세요</option>
                {positions.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-mute">핸드폰번호 <span className="text-gray-400">(선택)</span></span>
              <input
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>

            <Button type="submit" disabled={isLoading} className="mt-2">회원가입</Button>
          </form>

          {error && (
            <p className="text-red-600 mt-2 text-sm">{error}</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default SignupPage

