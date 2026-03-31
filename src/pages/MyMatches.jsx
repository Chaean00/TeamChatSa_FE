import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import Button from '../shared/ui/Button.jsx'

const initialReviewForm = {
  rating: '5',
  content: '',
}

function MyMatchesPage() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resultForms, setResultForms] = useState({})
  const [reviewForms, setReviewForms] = useState({})
  const [openResultId, setOpenResultId] = useState(null)
  const [openReviewId, setOpenReviewId] = useState(null)
  const [submittingResultId, setSubmittingResultId] = useState(null)
  const [submittingReviewId, setSubmittingReviewId] = useState(null)

  const fetchMatches = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get('/v1/matches/my-history')
      const matchData = res.data?.data || []
      setMatches(matchData)
      setResultForms(
        Object.fromEntries(
          matchData.map((match) => [match.matchPostId, { homeScore: '', awayScore: '' }])
        )
      )
      setReviewForms(
        Object.fromEntries(
          matchData.map((match) => [match.matchPostId, { ...initialReviewForm }])
        )
      )
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || fetchError.message || '진행한 경기를 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  const groupedMatches = useMemo(
    () => ({
      scheduled: matches.filter((match) => match.matchPhase === 'SCHEDULED'),
      completed: matches.filter((match) => match.matchPhase === 'COMPLETED'),
    }),
    [matches]
  )

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString
    return date.toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleResultChange = (matchPostId, field, value) => {
    setResultForms((prev) => ({
      ...prev,
      [matchPostId]: {
        ...prev[matchPostId],
        [field]: value,
      },
    }))
  }

  const handleReviewChange = (matchPostId, field, value) => {
    setReviewForms((prev) => ({
      ...prev,
      [matchPostId]: {
        ...prev[matchPostId],
        [field]: value,
      },
    }))
  }

  const submitResult = async (match) => {
    const form = resultForms[match.matchPostId] || {}
    try {
      setSubmittingResultId(match.matchPostId)
      await api.post('/v1/matches/results', {
        matchPostId: match.matchPostId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        homeScore: Number(form.homeScore),
        awayScore: Number(form.awayScore),
      })
      await fetchMatches()
      setOpenResultId(null)
    } catch (submitError) {
      alert(submitError.response?.data?.message || submitError.message || '경기 결과 등록에 실패했습니다.')
    } finally {
      setSubmittingResultId(null)
    }
  }

  const submitReview = async (match) => {
    const form = reviewForms[match.matchPostId] || initialReviewForm
    try {
      setSubmittingReviewId(match.matchPostId)
      await api.post('/v1/teams/reviews', {
        teamId: match.opponentTeamId,
        matchId: match.matchPostId,
        rating: Number(form.rating),
        content: form.content,
      })
      await fetchMatches()
      setOpenReviewId(null)
    } catch (submitError) {
      alert(submitError.response?.data?.message || submitError.message || '리뷰 등록에 실패했습니다.')
    } finally {
      setSubmittingReviewId(null)
    }
  }

  const renderMatchCard = (match) => {
    const resultForm = resultForms[match.matchPostId] || { homeScore: '', awayScore: '' }
    const reviewForm = reviewForms[match.matchPostId] || initialReviewForm

    return (
      <div key={match.matchPostId} className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-mute">{formatDate(match.matchDate)}</p>
            <h3 className="mt-1 line-clamp-2 break-keep text-lg font-semibold text-ink">{match.matchTitle}</h3>
            <p className="mt-1 text-sm text-mute">{match.placeName || match.address}</p>
          </div>
          <button onClick={() => navigate(`/matches/${match.matchPostId}`)} className="text-xs font-medium text-primary-700">
            상세
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm">
          <div className="font-medium text-ink">{match.homeTeamName} vs {match.awayTeamName}</div>
          <div className="mt-1 text-mute">상대 팀: {match.opponentTeamName}</div>
          {match.resultRegistered && (
            <div className="mt-2 text-primary-700 font-medium">결과 등록 완료 · {match.homeScore} : {match.awayScore}</div>
          )}
          {match.reviewWritten && <div className="mt-1 text-primary-700 font-medium">리뷰 작성 완료</div>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant={match.canRegisterResult ? 'primary' : 'ghost'}
            className="w-full"
            disabled={!match.canRegisterResult}
            onClick={() => {
              setOpenReviewId(null)
              setOpenResultId((prev) => (prev === match.matchPostId ? null : match.matchPostId))
            }}
          >
            {match.resultRegistered ? '결과 완료' : '결과 등록'}
          </Button>
          <Button
            variant={match.canReview ? 'primary' : 'ghost'}
            className="w-full"
            disabled={!match.canReview}
            onClick={() => {
              setOpenResultId(null)
              setOpenReviewId((prev) => (prev === match.matchPostId ? null : match.matchPostId))
            }}
          >
            {match.reviewWritten ? '리뷰 완료' : '리뷰 작성'}
          </Button>
        </div>

        {openResultId === match.matchPostId && match.canRegisterResult && (
          <div className="mt-4 grid gap-3 rounded-2xl border border-gray-100 p-4">
            <div className="text-sm font-medium text-ink">경기 결과 등록</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-mute">{match.homeTeamName}</span>
                <input
                  type="number"
                  min="0"
                  value={resultForm.homeScore}
                  onChange={(e) => handleResultChange(match.matchPostId, 'homeScore', e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-3"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-mute">{match.awayTeamName}</span>
                <input
                  type="number"
                  min="0"
                  value={resultForm.awayScore}
                  onChange={(e) => handleResultChange(match.matchPostId, 'awayScore', e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-3"
                />
              </label>
            </div>
            <Button onClick={() => submitResult(match)} disabled={submittingResultId === match.matchPostId} className="w-full">
              {submittingResultId === match.matchPostId ? '등록 중...' : '결과 저장'}
            </Button>
          </div>
        )}

        {openReviewId === match.matchPostId && match.canReview && (
          <div className="mt-4 grid gap-3 rounded-2xl border border-gray-100 p-4">
            <div className="text-sm font-medium text-ink">상대 팀 리뷰 작성</div>
            <select
              value={reviewForm.rating}
              onChange={(e) => handleReviewChange(match.matchPostId, 'rating', e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-3"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <option key={rating} value={rating}>{rating}점</option>
              ))}
            </select>
            <textarea
              rows={4}
              value={reviewForm.content}
              onChange={(e) => handleReviewChange(match.matchPostId, 'content', e.target.value)}
              placeholder="경기 매너와 분위기를 남겨주세요."
              className="rounded-xl border border-gray-200 px-3 py-3"
            />
            <Button onClick={() => submitReview(match)} disabled={submittingReviewId === match.matchPostId} className="w-full">
              {submittingReviewId === match.matchPostId ? '등록 중...' : '리뷰 저장'}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="space-y-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">진행한 경기</h1>
          <p className="mt-1 text-sm text-mute">확정된 경기 일정과 종료된 경기 기록을 확인할 수 있습니다.</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/mypage')}>← MY</Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-mute">로딩 중...</div>
      ) : error ? (
        <div className="rounded-[24px] border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : (
        <>
          <div className="rounded-[28px] border border-gray-100 bg-white/90 p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">예정된 경기</h2>
              <span className="text-sm text-mute">{groupedMatches.scheduled.length}건</span>
            </div>
            {groupedMatches.scheduled.length === 0 ? (
              <p className="text-sm text-mute">예정된 경기가 없습니다.</p>
            ) : (
              <div className="space-y-3">{groupedMatches.scheduled.map(renderMatchCard)}</div>
            )}
          </div>

          <div className="rounded-[28px] border border-gray-100 bg-white/90 p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">종료된 경기</h2>
              <span className="text-sm text-mute">{groupedMatches.completed.length}건</span>
            </div>
            {groupedMatches.completed.length === 0 ? (
              <p className="text-sm text-mute">종료된 경기가 없습니다.</p>
            ) : (
              <div className="space-y-3">{groupedMatches.completed.map(renderMatchCard)}</div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default MyMatchesPage
