import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../shared/hook/useUser'
import { api } from '../shared/api/client'
import Button from '../shared/ui/Button.jsx'

function MyTeamMembersPage() {
  const navigate = useNavigate()
  const { user, isLoading: isUserLoading } = useUser()
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [isLoadingTeam, setIsLoadingTeam] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [error, setError] = useState(null)

  const hasTeam = Boolean(user?.teamId)
  const canManageMembers = team && (team.userRole === 'LEADER' || team.userRole === 'CO_LEADER')

  useEffect(() => {
    if (!user?.teamId) {
      setIsLoadingTeam(false)
      setTeam(null)
      return
    }

    const fetchTeam = async () => {
      try {
        setIsLoadingTeam(true)
        setError(null)
        const res = await api.get(`/v1/teams/${user.teamId}`)
        const teamData = res.data?.data
        setTeam(teamData)
        fetchMembers(teamData.id)
      } catch (e) {
        setError(e.response?.data?.message || e.message || '팀 정보를 불러오지 못했습니다.')
        setTeam(null)
      } finally {
        setIsLoadingTeam(false)
      }
    }

    const fetchMembers = async (teamId) => {
      try {
        setIsLoadingMembers(true)
        const res = await api.get(`/v1/teams/${teamId}/members`)
        setMembers(res.data?.data || [])
      } catch (e) {
        setError(e.response?.data?.message || e.message || '팀 멤버를 불러오지 못했습니다.')
        setMembers([])
      } finally {
        setIsLoadingMembers(false)
      }
    }

    fetchTeam()
  }, [user?.teamId])

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('정말 이 멤버를 추방하시겠습니까?')) {
      return
    }

    try {
      setActionLoadingId(memberId)
      await api.delete(`/v1/teams/${team.id}/members/${memberId}`)
      setMembers(prev => prev.filter(member => member.userId !== memberId))
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '멤버 추방에 실패했습니다.'
      alert(errorMessage)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleChangeMemberRole = async (memberId, newRole) => {
    try {
      setActionLoadingId(memberId)
      await api.patch(`/v1/teams/${team.id}/members/${memberId}/role`, null, {
        params: { newRole }
      })
      setMembers(prev =>
        prev.map(member =>
          member.userId === memberId ? { ...member, role: newRole } : member
        )
      )
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '역할 변경에 실패했습니다.'
      alert(errorMessage)
    } finally {
      setActionLoadingId(null)
    }
  }

  const renderContent = () => {
    if (isUserLoading || isLoadingTeam) {
      return <p className="text-mute text-sm">로딩 중...</p>
    }

    if (!hasTeam) {
      return (
        <div className="text-center py-10">
          <p className="text-mute text-sm">아직 소속된 팀이 없습니다.</p>
          <Button onClick={() => navigate('/teams')} className="mt-4">팀 찾으러 가기</Button>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-10">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <Button variant="ghost" onClick={() => window.location.reload()}>새로고침</Button>
        </div>
      )
    }

    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-mute">팀 이름</p>
            <h2 className="text-2xl font-semibold text-ink">{team?.name}</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate('/mypage')}>← 마이페이지로</Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-sm text-mute">
          <span>총 멤버: <strong className="text-ink">{members.length}</strong></span>
          {team?.userRole && (
            <span>내 역할: <strong className="text-ink">{team.userRole}</strong></span>
          )}
        </div>

        {isLoadingMembers ? (
          <p className="text-mute text-sm">멤버 목록을 불러오는 중...</p>
        ) : members.length === 0 ? (
          <p className="text-mute text-sm">등록된 멤버가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.userId} className="p-3 border border-gray-100 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{member.userName || '이름 정보 없음'}</p>
                  <p className="text-xs text-mute mt-0.5">
                    닉네임: <span className="text-ink">{member.nickname || '닉네임이 설정되지 않았습니다.'}</span>
                  </p>
                  <p className="text-xs text-mute mt-0.5">
                    {member.role} · {member.position || '포지션 없음'}
                  </p>
                  {member.email && (
                    <p className="text-xs text-mute mt-0.5">{member.email}</p>
                  )}
                </div>
                {canManageMembers && member.role !== 'LEADER' && (
                  <div className="flex gap-2">
                    {team.userRole === 'LEADER' && (
                      <button
                        onClick={() => handleChangeMemberRole(member.userId, member.role === 'CO_LEADER' ? 'MEMBER' : 'CO_LEADER')}
                        disabled={actionLoadingId === member.userId}
                        className="text-xs px-2 py-1 text-primary-600 hover:bg-primary-50 rounded disabled:opacity-50"
                      >
                        {member.role === 'CO_LEADER' ? '부리더 해제' : '부리더 지정'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={actionLoadingId === member.userId}
                      className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    >
                      추방
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          <h1 className="text-2xl font-semibold text-ink mb-2">팀 멤버 관리</h1>
          <p className="text-mute text-sm mb-6">팀 멤버를 확인하고 역할을 관리할 수 있습니다.</p>
          {renderContent()}
        </div>
      </div>
    </section>
  )
}

export default MyTeamMembersPage

