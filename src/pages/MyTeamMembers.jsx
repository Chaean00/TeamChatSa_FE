import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../shared/hook/useUser'
import { api } from '../shared/api/client'
import { getErrorMessage } from '../shared/lib/errorMessage'
import Button from '../shared/ui/Button.jsx'

function MyTeamMembersPage() {
  const navigate = useNavigate()
  const { user, isLoading: isUserLoading } = useUser()
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [isLoadingTeam, setIsLoadingTeam] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [error, setError] = useState(null)

  const hasTeam = Boolean(user?.teamId)

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
        setError(getErrorMessage(e, '팀 정보를 불러오지 못했습니다.'))
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
        setError(getErrorMessage(e, '팀 멤버를 불러오지 못했습니다.'))
        setMembers([])
      } finally {
        setIsLoadingMembers(false)
      }
    }

    fetchTeam()
  }, [user?.teamId])

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

         <div className="mb-5 rounded-2xl bg-slate-50 p-4 text-sm text-mute">
           현재 백엔드에서는 멤버 조회 API만 제공하므로, 이 화면은 읽기 전용 팀 명단으로 구성했습니다.
         </div>

        {isLoadingMembers ? (
          <p className="text-mute text-sm">멤버 목록을 불러오는 중...</p>
        ) : members.length === 0 ? (
          <p className="text-mute text-sm">등록된 멤버가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
               <div key={member.userId} className="p-3 border border-gray-100 rounded-2xl">
                 <div className="flex items-start justify-between gap-3">
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
                   <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                     {member.role}
                   </span>
                 </div>
               </div>
             ))}
           </div>
        )}
      </>
    )
  }

  return (
    <section className="py-4">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-[28px] border border-gray-100 bg-white/90 shadow-card p-5">
          <h1 className="text-2xl font-semibold text-ink mb-2">팀 멤버 관리</h1>
          <p className="text-mute text-sm mb-6">우리 팀 멤버를 한눈에 확인할 수 있습니다.</p>
          {renderContent()}
        </div>
      </div>
    </section>
  )
}

export default MyTeamMembersPage
