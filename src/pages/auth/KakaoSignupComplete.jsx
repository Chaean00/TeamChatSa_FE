import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { getErrorMessage } from '../../shared/lib/errorMessage'
import { prefetchUser } from '../../shared/hook/useUser'
import Button from '../../shared/ui/Button.jsx'

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
  { value: 'ALL', label: 'ALL - 모든 포지션' },
]

function KakaoSignupCompletePage() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [position, setPosition] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await api.patch('/v1/users', {
        nickname,
        position,
        phone: phone || undefined,
      })

      await prefetchUser()
      try {
        window.sessionStorage.setItem('authNotice', '카카오 가입이 완료되었습니다.')
      } catch {}
      navigate('/', { replace: true })
    } catch (e) {
      setError(getErrorMessage(e, '추가 정보를 저장하지 못했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="py-14 sm:py-20">
      <div className="max-w-sm mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          <h2 className="text-2xl font-semibold text-ink">추가 정보 입력</h2>
          <p className="mt-1 text-sm text-mute">카카오 인증이 완료되었습니다. 서비스 이용에 필요한 정보만 입력해주세요.</p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-mute">닉네임</span>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} required className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-mute">선호 포지션</span>
              <select value={position} onChange={(e) => setPosition(e.target.value)} required className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200">
                <option value="">선택해주세요</option>
                {positions.map((pos) => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-sm text-mute">핸드폰번호</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={isLoading} className="mt-2">
              {isLoading ? '저장 중...' : '시작하기'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default KakaoSignupCompletePage
