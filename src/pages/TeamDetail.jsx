import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import { useUser } from '../shared/hook/useUser'
import Button from '../shared/ui/Button.jsx'

function TeamDetailPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [team, setTeam] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isApplying, setIsApplying] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')

  useEffect(() => {
    fetchTeamDetail()
  }, [teamId])

  const fetchTeamDetail = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get(`/v1/teams/${teamId}`)
      setTeam(res.data?.data)
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '팀 정보를 불러오는데 실패했습니다.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async () => {
    if (!applyMessage.trim()) {
      alert('가입 신청 메시지를 입력해주세요.')
      return
    }

    try {
      setIsApplying(true)
      await api.post(`/v1/teams/${teamId}/join`, {
        message: applyMessage
      })
      alert('가입 신청이 완료되었습니다.')
      navigate('/teams', { replace: true })
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || '가입 신청에 실패했습니다.'
      alert(errorMessage)
    } finally {
      setIsApplying(false)
    }
  }

  if (isLoading) {
    return (
      <section className="py-10 sm:py-14">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-10">
            <p className="text-mute">로딩 중...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error || !team) {
    return (
      <section className="py-10 sm:py-14">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-10">
            <p className="text-red-600">{error || '팀 정보를 찾을 수 없습니다.'}</p>
            <Button
              variant="ghost"
              onClick={() => navigate('/teams', { replace: true })}
              className="mt-4"
            >
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </section>
    )
  }

  const hasTeam = Boolean(user?.teamId)

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/teams', { replace: true })}
          className="mb-4"
        >
          ← 목록으로
        </Button>

        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          {team.img && (
            <div className="w-full h-64 mb-6 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={team.img}
                alt={team.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-ink mb-2">{team.name}</h2>
              <div className="text-mute text-sm">{team.area}</div>
            </div>

            {team.description && (
              <div>
                <h3 className="text-sm font-medium text-ink mb-2">팀 소개</h3>
                <p className="text-mute text-sm whitespace-pre-wrap">{team.description}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-ink mb-2">팀 정보</h3>
              <div className="text-mute text-sm mb-1">멤버 {team.memberCount}명</div>
              {team.level && (
                <div className="text-mute text-sm">레벨: {team.level}</div>
              )}
            </div>

            {!hasTeam && (
              <div className="pt-4 border-t border-gray-100">
                <label className="grid gap-1 mb-4">
                  <span className="text-sm text-mute">가입 신청 메시지</span>
                  <textarea
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    rows={3}
                    className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                    placeholder="가입 신청 메시지를 입력하세요"
                  />
                </label>
                <Button
                  onClick={handleApply}
                  disabled={isApplying}
                  className="w-full"
                >
                  {isApplying ? '신청 중...' : '가입 신청하기'}
                </Button>
              </div>
            )}
            {hasTeam && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-mute">이미 다른 팀에 소속되어 있어 가입 신청을 할 수 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TeamDetailPage

