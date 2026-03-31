import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../shared/hook/useAuth'
import { useUser } from '../shared/hook/useUser'
import { api } from '../shared/api/client'
import { getErrorMessage } from '../shared/lib/errorMessage'
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
  { value: 'ALL', label: 'ALL - 모든 포지션' },
]

function MyPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { user, isLoading, refetch } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [nicknameError, setNicknameError] = useState(null)
  const [formData, setFormData] = useState({ nickname: '', phone: '', position: '' })
  const [myTeam, setMyTeam] = useState(null)
  const [teamApplications, setTeamApplications] = useState([])
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordFormData, setPasswordFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        nickname: user.nickname || '',
        phone: user.phone || '',
        position: user.position || '',
      })
    }
  }, [user, isEditing])

  useEffect(() => {
    if (!user?.teamId) {
      setMyTeam(null)
      return
    }

    const fetchMyTeam = async () => {
      try {
        setIsLoadingTeam(true)
        const res = await api.get(`/v1/teams/${user.teamId}`)
        const teamData = res.data?.data
        setMyTeam(teamData)

        if (teamData?.userRole === 'LEADER' || teamData?.userRole === 'CO_LEADER') {
          setIsLoadingApplications(true)
          const appRes = await api.get(`/v1/teams/${teamData.id}/applications`)
          setTeamApplications(appRes.data?.data || [])
        } else {
          setTeamApplications([])
        }
      } catch (fetchError) {
        console.error('팀 정보 조회 실패:', fetchError)
        setMyTeam(null)
      } finally {
        setIsLoadingTeam(false)
        setIsLoadingApplications(false)
      }
    }

    fetchMyTeam()
  }, [user?.teamId])

  const isTeamLeader = myTeam?.userRole === 'LEADER' || myTeam?.userRole === 'CO_LEADER'

  const pendingApplications = useMemo(
    () => teamApplications.filter((application) => application.status === 'PENDING'),
    [teamApplications]
  )

  const positionLabel = positions.find((position) => position.value === user?.position)?.label || user?.position || '설정되지 않음'

  const checkNickname = async (nickname) => {
    if (!nickname || nickname === user?.nickname) {
      setNicknameError(null)
      return true
    }

    try {
      const res = await api.get('/v1/users/check', { params: { nickname } })
      const isAvailable = Boolean(res.data?.data)
      if (!isAvailable) {
        setNicknameError('이미 사용 중인 닉네임입니다.')
      } else {
        setNicknameError(null)
      }
      return isAvailable
    } catch (nicknameCheckError) {
      setNicknameError(getErrorMessage(nicknameCheckError, '닉네임 확인에 실패했습니다.'))
      return false
    }
  }

  const handleApplication = async (applicationId, action) => {
    try {
      await api.patch(`/v1/teams/${myTeam.id}/applications/${applicationId}/${action}`)
      const appRes = await api.get(`/v1/teams/${myTeam.id}/applications`)
      setTeamApplications(appRes.data?.data || [])
    } catch (applicationError) {
      alert(getErrorMessage(applicationError, '팀 신청 처리에 실패했습니다.'))
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === 'nickname') {
      setNicknameError(null)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    if (formData.nickname !== user?.nickname) {
      const isAvailable = await checkNickname(formData.nickname)
      if (!isAvailable) {
        setIsSaving(false)
        return
      }
    }

    try {
      await api.patch('/v1/users', {
        nickname: formData.nickname,
        phone: formData.phone || undefined,
        position: formData.position,
      })
      await refetch()
      setIsEditing(false)
    } catch (saveError) {
      setError(getErrorMessage(saveError, '정보 수정에 실패했습니다.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setPasswordError(null)

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    setIsSavingPassword(true)
    try {
      await api.put('/v1/users/password', {
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
      })
      setIsChangingPassword(false)
      setPasswordFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      alert('비밀번호를 변경했습니다.')
    } catch (passwordSaveError) {
      setPasswordError(getErrorMessage(passwordSaveError, '비밀번호 변경에 실패했습니다.'))
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말 회원탈퇴를 진행할까요?')) {
      return
    }

    setIsDeleting(true)
    try {
      await api.delete('/v1/users')
      await logout({ skipRequest: true })
      navigate('/', { replace: true })
    } catch (deleteError) {
      alert(getErrorMessage(deleteError, '회원탈퇴에 실패했습니다.'))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return <section className="py-4 text-center text-sm text-mute">로딩 중...</section>
  }

  return (
    <section className="space-y-4 py-4">
      <div className="rounded-[28px] bg-[linear-gradient(135deg,#112031_0%,#0f766e_100%)] p-5 text-white shadow-card">
        <div className="text-xs uppercase tracking-[0.24em] text-cyan-100">MY LOCKER</div>
        <div className="mt-2 text-2xl font-semibold">{user?.nickname || user?.name} 님</div>
        <div className="mt-2 text-sm text-cyan-50/90">{user?.email}</div>
        <div className="mt-4 flex gap-2">
          <Button variant="ghost" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => navigate('/mypage/notifications')}>
            알림
          </Button>
          <Button variant="ghost" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => navigate('/mypage/team-posts')}>
            우리 팀 글
          </Button>
        </div>
      </div>

      <div className="rounded-[28px] border border-gray-100 bg-white/90 p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">내 프로필</h2>
            <p className="text-sm text-mute">내 계정 정보를 확인하고 수정할 수 있습니다.</p>
          </div>
          {!isEditing && (
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              수정
            </Button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="grid gap-1 text-sm">
              <span className="text-mute">닉네임</span>
              <input name="nickname" value={formData.nickname} onChange={handleChange} className="rounded-2xl border border-gray-200 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-mute">포지션</span>
              <select name="position" value={formData.position} onChange={handleChange} className="rounded-2xl border border-gray-200 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200">
                <option value="">선택해주세요</option>
                {positions.map((position) => (
                  <option key={position.value} value={position.value}>
                    {position.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-mute">전화번호</span>
              <input name="phone" value={formData.phone} onChange={handleChange} className="rounded-2xl border border-gray-200 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-primary-200" />
            </label>
            {(error || nicknameError) && <p className="text-sm text-red-600">{error || nicknameError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving} className="flex-1">저장</Button>
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">취소</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-mute">이름</div>
              <div className="mt-1 font-medium text-ink">{user?.name}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-mute">포지션</div>
              <div className="mt-1 font-medium text-ink">{positionLabel}</div>
            </div>
          </div>
        )}
      </div>

      {myTeam && (
        <div className="rounded-[28px] border border-gray-100 bg-white/90 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">내 팀</h2>
              <p className="text-sm text-mute">{myTeam.name} · {myTeam.levelLabel || `Level ${myTeam.level}`}</p>
            </div>
            <Button variant="ghost" onClick={() => navigate(`/teams/${myTeam.id}`)}>상세</Button>
          </div>

          {isLoadingTeam && <p className="mt-3 text-sm text-mute">팀 정보를 동기화하는 중...</p>}

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <button onClick={() => navigate('/mypage/team-members')} className="rounded-2xl bg-slate-50 p-4 text-left">
              <div className="font-medium text-ink">멤버 명단</div>
              <div className="mt-1 text-mute">우리 팀 멤버 확인</div>
            </button>
            <button onClick={() => navigate('/mypage/team-posts')} className="rounded-2xl bg-slate-50 p-4 text-left">
              <div className="font-medium text-ink">매치 게시글</div>
              <div className="mt-1 text-mute">팀 작성 글 모아보기</div>
            </button>
            <button onClick={() => navigate('/mypage/matches')} className="rounded-2xl bg-slate-50 p-4 text-left">
              <div className="font-medium text-ink">진행한 경기</div>
              <div className="mt-1 text-mute">결과 등록과 리뷰 작성</div>
            </button>
          </div>

          {isTeamLeader && (
            <div className="mt-5 border-t border-gray-100 pt-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-ink">가입 신청</h3>
                {isLoadingApplications && <span className="text-xs text-mute">불러오는 중...</span>}
              </div>

              {pendingApplications.length === 0 ? (
                <p className="text-sm text-mute">대기 중인 가입 신청이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {pendingApplications.map((application) => (
                    <div key={application.applicationId} className="rounded-2xl border border-gray-100 p-4">
                      <div className="text-sm font-medium text-ink">{application.userNickname || application.userName}</div>
                      <div className="mt-1 text-sm text-mute">{application.message || '메시지 없음'}</div>
                      <div className="mt-3 flex gap-2">
                        <Button className="flex-1" onClick={() => handleApplication(application.applicationId, 'accept')}>수락</Button>
                        <Button variant="ghost" className="flex-1" onClick={() => handleApplication(application.applicationId, 'reject')}>거절</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {user?.isLocalAccount !== false && (
        <div className="rounded-[28px] border border-gray-100 bg-white/90 p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">비밀번호 변경</h2>
              <p className="text-sm text-mute">로컬 계정만 수정할 수 있습니다.</p>
            </div>
            {!isChangingPassword && <Button variant="ghost" onClick={() => setIsChangingPassword(true)}>열기</Button>}
          </div>

          {isChangingPassword && (
            <form onSubmit={handlePasswordSubmit} className="grid gap-3">
              <input type="password" placeholder="현재 비밀번호" value={passwordFormData.currentPassword} onChange={(e) => setPasswordFormData((prev) => ({ ...prev, currentPassword: e.target.value }))} className="rounded-2xl border border-gray-200 px-3 py-3" />
              <input type="password" placeholder="새 비밀번호" value={passwordFormData.newPassword} onChange={(e) => setPasswordFormData((prev) => ({ ...prev, newPassword: e.target.value }))} className="rounded-2xl border border-gray-200 px-3 py-3" />
              <input type="password" placeholder="새 비밀번호 확인" value={passwordFormData.confirmPassword} onChange={(e) => setPasswordFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))} className="rounded-2xl border border-gray-200 px-3 py-3" />
              {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={isSavingPassword} className="flex-1">변경</Button>
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsChangingPassword(false)}>닫기</Button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="flex gap-2 pb-2">
        <Button variant="ghost" className="flex-1" onClick={async () => { await logout(); navigate('/', { replace: true }) }}>로그아웃</Button>
        <Button variant="ghost" className="flex-1 text-red-600" onClick={handleDeleteAccount} disabled={isDeleting}>
          {isDeleting ? '처리 중...' : '회원탈퇴'}
        </Button>
      </div>
    </section>
  )
}

export default MyPage
