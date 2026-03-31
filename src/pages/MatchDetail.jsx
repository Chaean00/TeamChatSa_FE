import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import { getErrorMessage } from '../shared/lib/errorMessage'
import { useUser } from '../shared/hook/useUser'
import Button from '../shared/ui/Button.jsx'
import KakaoMap from '../shared/components/KakaoMap.jsx'

function MatchDetailPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [match, setMatch] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isApplying, setIsApplying] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [myTeam, setMyTeam] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false)
  const isOwner = user && match && user.id === match.teamId
  const canManageMatch = myTeam && match && myTeam.id === match.teamId && (myTeam.userRole === 'LEADER' || myTeam.userRole === 'CO_LEADER')
  // 본인 팀이 작성한 매치인지 확인 (신청 버튼 숨김용)
  const isMyTeamMatch = user?.teamId && match && user.teamId === match.teamId

  useEffect(() => {
    fetchMatchDetail()
  }, [matchId])

  useEffect(() => {
    if (user?.teamId) {
      fetchMyTeam()
    } else {
      setMyTeam(null)
    }
  }, [user?.teamId])

  useEffect(() => {
    if (myTeam && match && myTeam.id === match.teamId && (myTeam.userRole === 'LEADER' || myTeam.userRole === 'CO_LEADER')) {
      fetchApplicants()
    } else {
      setApplicants([])
    }
  }, [myTeam, match, matchId])

  const fetchMyTeam = async () => {
    if (!user?.teamId) {
      setMyTeam(null)
      return
    }

    try {
      const res = await api.get(`/v1/teams/${user.teamId}`)
      const teamData = res.data?.data
      // userRole 정보가 API 응답에 포함됨
      setMyTeam(teamData)
    } catch (e) {
      console.error('팀 정보 조회 실패:', e)
      setMyTeam(null)
    }
  }

  const fetchMatchDetail = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get(`/v1/matches/${matchId}`)
      setMatch(res.data?.data)
    } catch (e) {
      setError(getErrorMessage(e, '매치 정보를 불러오지 못했습니다.'))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchApplicants = async () => {
    if (!matchId) return

    try {
      setIsLoadingApplicants(true)
      const res = await api.get(`/v1/matches/${matchId}/applicants`)
      const applicantsData = res.data?.data || []
      setApplicants(applicantsData)
    } catch (e) {
      console.error('신청자 목록 조회 실패:', e)
      setApplicants([])
    } finally {
      setIsLoadingApplicants(false)
    }
  }

  const handleAcceptApplicant = async (applicantId) => {
    try {
      await api.post(`/v1/matches/${matchId}/accept/${applicantId}`)
      alert('매치 신청을 수락했습니다.')
      fetchApplicants()
      fetchMatchDetail()
    } catch (e) {
      alert(getErrorMessage(e, '매치 신청 수락에 실패했습니다.'))
    }
  }

  const handleRejectApplicant = async (applicantId) => {
    if (!window.confirm('정말 이 매치 신청을 거절하시겠습니까?')) {
      return
    }

    try {
      await api.post(`/v1/matches/${matchId}/reject/${applicantId}`)
      alert('매치 신청을 거절했습니다.')
      fetchApplicants()
    } catch (e) {
      alert(getErrorMessage(e, '매치 신청 거절에 실패했습니다.'))
    }
  }

  const handleApply = async () => {
    try {
      setIsApplying(true)
      await api.post(`/v1/matches/${matchId}/apply`, {
        message: applyMessage || undefined
      })
      alert('매치 신청이 완료되었습니다.')
      fetchMatchDetail() // 신청 후 정보 갱신
      setApplyMessage('')
    } catch (e) {
      alert(getErrorMessage(e, '매치 신청에 실패했습니다.'))
    } finally {
      setIsApplying(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('매치 신청을 취소하시겠습니까?')) {
      return
    }

    try {
      setIsCanceling(true)
      await api.post(`/v1/matches/${matchId}/cancel`)
      alert('매치 신청이 취소되었습니다.')
      fetchMatchDetail() // 취소 후 정보 갱신
    } catch (e) {
      alert(getErrorMessage(e, '매치 신청 취소에 실패했습니다.'))
    } finally {
      setIsCanceling(false)
    }
  }

  const handleDeleteMatch = async () => {
    if (!window.confirm('정말 이 매치 게시글을 삭제하시겠습니까?')) {
      return
    }

    try {
      setIsDeleting(true)
      await api.delete(`/v1/matches/${matchId}`)
      alert('매치 게시글이 삭제되었습니다.')
      navigate('/matches', { replace: true })
    } catch (e) {
      alert(getErrorMessage(e, '매치 게시글 삭제에 실패했습니다.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()]
    return `${year}년 ${month}월 ${day}일 (${weekday})`
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

  if (error || !match) {
    return (
      <section className="py-10 sm:py-14">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-10">
            <p className="text-red-600">{error || '매치 정보를 찾을 수 없습니다.'}</p>
            <Button
              variant="ghost"
              onClick={() => navigate('/matches', { replace: true })}
              className="mt-4"
            >
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/matches', { replace: true })}
            className="justify-self-start"
          >
            ← 목록으로
          </Button>
          {canManageMatch && (
            <Button
              variant="ghost"
              onClick={handleDeleteMatch}
              disabled={isDeleting}
              className="justify-self-end text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isDeleting ? '삭제 중...' : '게시글 삭제'}
            </Button>
          )}
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white/90 shadow-card p-5">
          <div className="grid gap-4">
            <div>
              <h2 className="mb-2 break-keep text-[28px] font-semibold leading-tight text-ink">{match.title}</h2>
              {match.teamName && (
                <div className="flex items-center gap-3 mt-3">
                  {match.teamImg ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                      <img
                        src={match.teamImg}
                        alt={match.teamName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {match.teamName ? match.teamName.charAt(0).toUpperCase() : 'T'}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 break-keep text-ink font-medium">{match.teamName}</div>
                    {match.teamLevel && (
                      <div className="text-mute text-xs">레벨: {match.teamLevel}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-ink mb-2">매치 정보</h3>
              <div className="grid gap-2 text-sm mb-4">
                <div className="flex">
                  <span className="text-mute w-20">날짜</span>
                  <span className="min-w-0 break-keep text-ink">{formatDate(match.matchDate)}</span>
                </div>
                {match.matchTime && (
                  <div className="flex">
                    <span className="text-mute w-20">시간</span>
                    <span className="min-w-0 break-keep text-ink">{match.matchTime}</span>
                  </div>
                )}
                <div className="flex">
                  <span className="text-mute w-20">장소</span>
                  <span className="min-w-0 break-keep text-ink">{match.placeName || match.address}</span>
                </div>
                {match.address && (
                  <div className="flex">
                    <span className="text-mute w-20">주소</span>
                    <span className="min-w-0 break-keep text-ink">{match.address}</span>
                  </div>
                )}
              </div>
              {match.lat && match.lng && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-ink mb-2">위치</h4>
                  <KakaoMap
                    initialLat={parseFloat(match.lat)}
                    initialLng={parseFloat(match.lng)}
                    initialAddress={match.address}
                    initialPlaceName={match.placeName}
                    readOnly={true}
                  />
                </div>
              )}
            </div>

            {match.content && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-ink mb-2">상세 내용</h3>
                <p className="text-mute text-sm whitespace-pre-wrap">{match.content}</p>
              </div>
            )}

            {!isOwner && !isMyTeamMatch && (
              <div className="pt-4 border-t border-gray-100">
                <label className="grid gap-1 mb-4">
                  <span className="text-sm text-mute">신청 메시지 (선택사항)</span>
                  <textarea
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    rows={3}
                    className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
                    placeholder="신청 메시지를 입력하세요"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="w-full"
                  >
                    {isApplying ? '신청 중...' : '매치 신청하기'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isCanceling}
                    variant="ghost"
                    className="w-full"
                  >
                    {isCanceling ? '취소 중...' : '신청 취소'}
                  </Button>
                </div>
              </div>
            )}

            {isMyTeamMatch && !canManageMatch && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-mute">본인 팀이 작성한 매치입니다.</p>
              </div>
            )}

            {canManageMatch && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-ink mb-2">매치 신청자</h3>
                {isLoadingApplicants ? (
                  <p className="text-mute text-sm">로딩 중...</p>
                ) : applicants.length === 0 ? (
                  <p className="text-mute text-sm">신청자가 없습니다.</p>
                ) : (
                  <div className="space-y-3">
                    {applicants.map((applicant) => (
                       <div key={applicant.applicantId} className="p-3 border border-gray-100 rounded-2xl">
                         <div className="flex items-start gap-3 mb-2">
                          {applicant.teamImg ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                              <img
                                src={applicant.teamImg}
                                alt={applicant.teamName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-semibold text-xs">
                                {applicant.teamName ? applicant.teamName.charAt(0).toUpperCase() : 'T'}
                              </span>
                            </div>
                          )}
                           <div className="min-w-0 flex-1">
                             <div className="line-clamp-2 break-keep text-sm font-medium text-ink">{applicant.teamName}</div>
                             {applicant.teamLevel && (
                               <div className="text-xs text-mute">레벨: {applicant.teamLevel}</div>
                             )}
                             {applicant.message && (
                               <div className="line-clamp-3 break-keep text-xs text-mute mt-1">{applicant.message}</div>
                             )}
                            <div className="text-xs text-mute mt-1">
                              신청일: {new Date(applicant.appliedAt).toLocaleDateString()}
                            </div>
                            {applicant.status && (
                              <div className="text-xs mt-1">
                                {applicant.status === 'ACCEPTED' && (
                                  <span className="text-green-600 font-medium">✓ 수락됨</span>
                                )}
                                {applicant.status === 'REJECTED' && (
                                  <span className="text-red-600 font-medium">✗ 거절됨</span>
                                )}
                                {applicant.status === 'CANCELLED' && (
                                  <span className="text-gray-600 font-medium">취소됨</span>
                                )}
                                {applicant.status === 'PENDING' && (
                                  <span className="text-blue-600 font-medium">대기 중</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {applicant.status === 'PENDING' ? (
                           <div className="grid grid-cols-2 gap-2 mt-2">
                             <Button
                               onClick={() => handleAcceptApplicant(applicant.applicantId)}
                               className="w-full text-sm"
                             >
                               수락
                             </Button>
                            <Button
                               onClick={() => handleRejectApplicant(applicant.applicantId)}
                               variant="ghost"
                               className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                             >
                               거절
                             </Button>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {applicant.status === 'ACCEPTED' && (
                              <p className="text-sm text-green-600 font-medium">매치가 성사되었습니다.</p>
                            )}
                            {applicant.status === 'REJECTED' && (
                              <p className="text-sm text-red-600">거절된 신청입니다.</p>
                            )}
                            {applicant.status === 'CANCELLED' && (
                              <p className="text-sm text-gray-600">취소된 신청입니다.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isOwner && !canManageMatch && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-mute mb-2">이 매치의 작성자입니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MatchDetailPage
