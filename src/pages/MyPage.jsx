import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../shared/hook/useAuth'
import { useUser } from '../shared/hook/useUser'
import { api } from '../shared/api/client'
import Button from '../shared/ui/Button.jsx'

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

function MyPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user, isLoading, refetch } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [nicknameError, setNicknameError] = useState(null)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    phone: '',
    position: '',
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)

  // 사용자 정보가 로드되면 폼 데이터 초기화
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        nickname: user?.nickname || '',
        phone: user?.phone || '',
        position: user?.position || '',
      })
    }
  }, [user, isEditing])

  const handleEdit = () => {
    if (user) {
      setFormData({
        nickname: user?.nickname || '',
        phone: user?.phone || '',
        position: user?.position || '',
      })
    }
    setIsEditing(true)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
  }

  const checkNickname = async (nickname) => {
    if (!nickname || nickname.trim() === '') {
      setNicknameError(null)
      return true
    }

    // 현재 닉네임과 같으면 검사하지 않음
    if (nickname === user?.nickname) {
      setNicknameError(null)
      return true
    }

    setIsCheckingNickname(true)
    setNicknameError(null)

    try {
      const res = await api.get(`/v1/users/check`, {
        params: { nickname }
      })
      const isAvailable = res.data?.available ?? res.data?.data?.available ?? true
      
      if (!isAvailable) {
        setNicknameError('이미 사용 중인 닉네임입니다.')
        return false
      } else {
        setNicknameError(null)
        return true
      }
    } catch (e) {
      setNicknameError(null)
      return true
    } finally {
      setIsCheckingNickname(false)
    }
  }

  // 닉네임 변경 시 debounce로 중복 검사
  useEffect(() => {
    if (!isEditing) return
    
    const nickname = formData.nickname
    
    // 빈 값이거나 현재 닉네임과 같으면 검사하지 않음
    if (!nickname || nickname.trim() === '' || nickname === user?.nickname) {
      setNicknameError(null)
      return
    }

    const timer = setTimeout(() => {
      checkNickname(nickname)
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.nickname, user?.nickname, isEditing])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // 닉네임 변경 시 에러 초기화 (실제 검사는 useEffect에서)
    if (name === 'nickname') {
      setNicknameError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    // 닉네임이 변경되었고, 현재 중복 검사 결과가 없으면 다시 검사
    if (formData.nickname && formData.nickname !== user?.nickname) {
      const isAvailable = await checkNickname(formData.nickname)
      if (!isAvailable) {
        setIsSaving(false)
        return
      }
    }

    try {
      const payload = {
        nickname: formData.nickname,
        position: formData.position,
      }
      if (formData.phone) {
        payload.phone = formData.phone
      }

      await api.patch('/v1/users', payload)
      setIsEditing(false)
      // 사용자 정보 다시 조회
      await refetch()
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '정보 수정에 실패했습니다.'
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const handleDeleteAccount = async () => {
    // 확인 다이얼로그
    const confirmed = window.confirm(
      '정말 회원탈퇴를 하시겠습니까?\n탈퇴 후에는 모든 데이터가 삭제되며 복구할 수 없습니다.'
    )
    
    if (!confirmed) {
      return
    }

    // 이중 확인
    const doubleConfirmed = window.confirm(
      '회원탈퇴를 최종 확인합니다.\n정말 탈퇴하시겠습니까?'
    )
    
    if (!doubleConfirmed) {
      return
    }

    setIsDeleting(true)
    
    try {
      await api.delete('/v1/users')
      alert('회원탈퇴가 완료되었습니다.')
      logout()
      navigate('/', { replace: true })
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '회원탈퇴에 실패했습니다.'
      alert(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePasswordEdit = () => {
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setIsChangingPassword(true)
    setPasswordError(null)
  }

  const handlePasswordCancel = () => {
    setIsChangingPassword(false)
    setPasswordError(null)
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordFormData(prev => ({ ...prev, [name]: value }))
    setPasswordError(null)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setIsSavingPassword(true)
    setPasswordError(null)

    // 새 비밀번호와 확인 비밀번호 일치 확인
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      setIsSavingPassword(false)
      return
    }

    // 비밀번호 길이 확인
    if (passwordFormData.newPassword.length < 8) {
      setPasswordError('비밀번호는 최소 8자 이상이어야 합니다.')
      setIsSavingPassword(false)
      return
    }

    try {
      await api.put('/v1/users/password', {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
      })
      
      alert('비밀번호가 성공적으로 변경되었습니다.')
      setIsChangingPassword(false)
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
      })
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '비밀번호 변경에 실패했습니다.'
      setPasswordError(errorMessage)
    } finally {
      setIsSavingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <section className="py-10 sm:py-14">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6 text-center">
            <p className="text-mute">로딩 중...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-2xl mx-auto">
        <div className="grid gap-2 mb-6">
          <h2 className="text-3xl font-semibold text-ink">마이페이지</h2>
          <p className="text-mute">내 정보를 확인하고 관리할 수 있어요.</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-ink">정보 수정</h3>
              </div>

              <div className="grid gap-1">
                <span className="text-sm text-mute">이름</span>
                <p className="text-ink font-medium">{user?.userName || user?.name || '이름 없음'}</p>
                <p className="text-xs text-mute">이름은 변경할 수 없습니다.</p>
              </div>

              <label className="grid gap-1">
                <span className="text-sm text-mute">닉네임</span>
                <div className="relative">
                  <input
                    type="text"
                    name="nickname"
                    placeholder="닉네임을 입력하세요"
                    value={formData.nickname}
                    onChange={handleChange}
                    className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 ${
                      nicknameError 
                        ? 'border-red-300 focus:ring-red-200' 
                        : 'border-gray-200 focus:ring-primary-200'
                    }`}
                  />
                  {isCheckingNickname && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mute">
                      확인 중...
                    </span>
                  )}
                </div>
                {nicknameError && (
                  <p className="text-red-600 text-xs mt-1">{nicknameError}</p>
                )}
                {formData.nickname && !nicknameError && !isCheckingNickname && formData.nickname !== user?.nickname && (
                  <p className="text-green-600 text-xs mt-1">사용 가능한 닉네임입니다.</p>
                )}
              </label>

              <div className="grid gap-1">
                <span className="text-sm text-mute">이메일</span>
                <p className="text-ink font-medium">{user?.email || '이메일 없음'}</p>
                <p className="text-xs text-mute">이메일은 변경할 수 없습니다.</p>
              </div>

              <label className="grid gap-1">
                <span className="text-sm text-mute">선호 포지션</span>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
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
                <span className="text-sm text-mute">핸드폰번호</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="010-1234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <Button type="submit" disabled={isSaving || isCheckingNickname || !!nicknameError} className="flex-1">
                  저장
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                  취소
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-ink">내 정보</h3>
                <Button variant="ghost" onClick={handleEdit} className="text-sm">
                  수정
                </Button>
              </div>

              <div className="grid gap-1">
                <span className="text-sm text-mute">이름</span>
                <p className="text-ink font-medium">{user?.userName || user?.name || '이름 없음'}</p>
              </div>

              <div className="grid gap-1">
                <span className="text-sm text-mute">닉네임</span>
                <p className="text-ink font-medium">{user?.nickname || '설정되지 않음'}</p>
              </div>

              <div className="grid gap-1">
                <span className="text-sm text-mute">이메일</span>
                <p className="text-ink font-medium">{user?.email || '이메일 없음'}</p>
              </div>

              <div className="grid gap-1">
                <span className="text-sm text-mute">선호 포지션</span>
                <p className="text-ink font-medium">
                  {user?.position 
                    ? positions.find(p => p.value === user?.position)?.label || user?.position
                    : '설정되지 않음'}
                </p>
              </div>

              {user?.phone && (
                <div className="grid gap-1">
                  <span className="text-sm text-mute">핸드폰번호</span>
                  <p className="text-ink font-medium">{user.phone}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 비밀번호 변경 섹션 - 카카오 로그인 사용자는 숨김 */}
        {(() => {
          // isLocalAccount가 false이면 카카오 로그인 사용자
          const isKakaoUser = user?.isLocalAccount === false

          if (isKakaoUser) {
            return null
          }

          return (
            <>
              <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">비밀번호 변경</h3>
                    <p className="text-mute text-sm mt-1">비밀번호를 변경할 수 있어요.</p>
                  </div>
                  {!isChangingPassword && (
                    <Button variant="ghost" onClick={handlePasswordEdit} className="text-sm">
                      변경
                    </Button>
                  )}
                </div>

                {isChangingPassword ? (
                <form onSubmit={handlePasswordSubmit} className="grid gap-4">
                  <label className="grid gap-1">
                    <span className="text-sm text-mute">현재 비밀번호</span>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="현재 비밀번호를 입력하세요"
                      value={passwordFormData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-sm text-mute">새 비밀번호</span>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="새 비밀번호를 입력하세요 (최소 8자)"
                      value={passwordFormData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-sm text-mute">새 비밀번호 확인</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="새 비밀번호를 다시 입력하세요"
                      value={passwordFormData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={8}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                  </label>

                  {passwordError && (
                    <p className="text-red-600 text-sm">{passwordError}</p>
                  )}

                  <div className="flex gap-3 mt-2">
                    <Button type="submit" disabled={isSavingPassword} className="flex-1">
                      변경하기
                    </Button>
                    <Button type="button" variant="ghost" onClick={handlePasswordCancel} disabled={isSavingPassword}>
                      취소
                    </Button>
                  </div>
                </form>
                ) : (
                  <p className="text-mute text-sm">비밀번호를 변경하려면 변경 버튼을 클릭하세요.</p>
                )}
              </div>
              {/* 회원탈퇴 버튼 - 비밀번호 변경 섹션 아래 우측 */}
              <div className="flex justify-end mt-2">
                <button 
                  onClick={handleDeleteAccount} 
                  disabled={isDeleting}
                  className="text-xs py-1.5 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? '처리 중...' : '회원탈퇴'}
                </button>
              </div>
            </>
          )
        })()}

      </div>
    </section>
  )
}

export default MyPage

