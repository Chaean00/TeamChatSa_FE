import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { api } from '../shared/api/client'
import { useUser } from '../shared/hook/useUser'
import { getErrorMessage } from '../shared/lib/errorMessage'
import Button from '../shared/ui/Button.jsx'

const regions = [
  { value: '', label: '전체' },
  { value: '서울', label: '서울' },
  { value: '부산', label: '부산' },
  { value: '대구', label: '대구' },
  { value: '인천', label: '인천' },
  { value: '광주', label: '광주' },
  { value: '대전', label: '대전' },
  { value: '울산', label: '울산' },
  { value: '세종', label: '세종' },
  { value: '경기', label: '경기' },
  { value: '강원', label: '강원' },
  { value: '충청북도', label: '충북' },
  { value: '충청남도', label: '충남' },
  { value: '전북특별자치도', label: '전북' },
  { value: '전라남도', label: '전남' },
  { value: '경상북도', label: '경북' },
  { value: '경상남도', label: '경남' },
  { value: '제주특별자치도', label: '제주' },
]

const headCountOptions = [
  { value: '', label: '전체' },
  { value: '4', label: '4 vs 4' },
  { value: '5', label: '5 vs 5' },
  { value: '6', label: '6 vs 6' },
  { value: '7', label: '7 vs 7' },
  { value: '8', label: '8 vs 8' },
  { value: '9', label: '9 vs 9' },
  { value: '10', label: '10 vs 10' },
  { value: '11', label: '11 vs 11' },
]

function MatchesPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [recommendationQuery, setRecommendationQuery] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [isLastPage, setIsLastPage] = useState(false)
  const filterSheetRef = useRef(null)

  // 필터 상태 (입력 중인 필터)
  const [tempFilters, setTempFilters] = useState({
    startDate: '',
    endDate: '',
    region: '',
    headCount: '',
  })
  
  // 적용된 필터 상태
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: '',
    endDate: '',
    region: '',
    headCount: '',
  })

  const fetchMatches = useCallback(
    async (pageNum = 0) => {
      const isInitial = pageNum === 0
      try {
        if (isInitial) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }
        setError(null)
        
        const params = {
            page: pageNum,
            size: 20,
        }
        
        // 필터 파라미터 추가
        if (appliedFilters.startDate) {
          params.startDate = appliedFilters.startDate
        }
        if (appliedFilters.endDate) {
          params.endDate = appliedFilters.endDate
        }
        if (appliedFilters.region) {
          params.region = appliedFilters.region
        }
        if (appliedFilters.headCount) {
          params.headCount = parseInt(appliedFilters.headCount, 10)
        }
        
        const res = await api.get('/v1/matches', { params })
        const responseData = res.data?.data
        const matchesData = responseData?.content || []
        const last = responseData?.last ?? false

        setMatches((prev) => (isInitial ? matchesData : [...prev, ...matchesData]))
        setIsLastPage(last)
      } catch (e) {
        const errorMessage = e.response?.data?.message || e.message || '매치 목록을 불러오는데 실패했습니다.'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [appliedFilters]
  )

  // 적용된 필터 변경 시 검색 실행 (초기 로드 포함)
  useEffect(() => {
    setPage(0)
    setMatches([])
    setIsLastPage(false)
    fetchMatches(0)
  }, [appliedFilters, fetchMatches])
  
  const handleFilterChange = (name, value) => {
    setTempFilters(prev => ({
      ...prev,
      [name]: value,
    }))
  }
  
  const applyFilters = () => {
    setAppliedFilters(tempFilters)
    setPage(0)
    setMatches([])
    setIsLastPage(false)
  }
  
  const resetFilters = () => {
    const emptyFilters = {
      startDate: '',
      endDate: '',
      region: '',
      headCount: '',
    }
    setTempFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setPage(0)
    setMatches([])
    setIsLastPage(false)
  }
  
  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isLoading && !isLastPage) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMatches(nextPage)
    }
  }, [isLoadingMore, isLastPage, isLoading, page, fetchMatches])

  const fetchRecommendations = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (!user.teamId) {
      setRecommendations([])
      setError(null)
      return
    }

    if (!recommendationQuery.trim()) {
      setRecommendations([])
      return
    }

    try {
      setIsLoadingRecommendations(true)
      const res = await api.post('/v1/matches/recommendations', {
        query: recommendationQuery,
      })
      setRecommendations(res.data?.data || [])
    } catch (recommendationError) {
      setError(getErrorMessage(recommendationError, 'AI 추천을 불러오지 못했습니다.'))
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  useEffect(() => {
    if (!isFilterOpen) return

    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      try {
        filterSheetRef.current?.focus({ preventScroll: true })
      } catch {
        filterSheetRef.current?.focus()
      }
    }, 50)

    return () => {
      window.clearTimeout(focusTimer)
      const storedTop = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, Math.abs(parseInt(storedTop || '0', 10)))
    }
  }, [isFilterOpen])

  useEffect(() => {
    if (!isRecommendationOpen) return

    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'

    return () => {
      const storedTop = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, Math.abs(parseInt(storedTop || '0', 10)))
    }
  }, [isRecommendationOpen])

  const groupedMatches = useMemo(() => {
    if (!matches || matches.length === 0) return []
    const map = matches.reduce((acc, match) => {
      const key = match.matchDate || '기타'
      if (!acc[key]) acc[key] = []
      acc[key].push(match)
      return acc
    }, {})
    const sortedKeys = Object.keys(map).sort((a, b) => {
      if (a === '기타') return 1
      if (b === '기타') return -1
      return new Date(a) - new Date(b)
    })
    return sortedKeys.map((dateKey) => ({
      date: dateKey,
      items: map[dateKey],
    }))
  }, [matches])

  const formatDateHeader = (dateString) => {
    if (!dateString || dateString === '기타') return '기타 일정'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return dateString
    }
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}월 ${day}일`
  }

  const formatDateDetail = (dateString, time) => {
    if (!dateString) return time || ''
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return `${dateString}${time ? ` ${time}` : ''}`
    }
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()]
    const timeText = time ? ` ${time}` : ''
    return `${month}/${day}(${weekday})${timeText}`
  }

  const canUseRecommendation = Boolean(user?.teamId)
  const dateRangeChip = appliedFilters.startDate && appliedFilters.endDate
    ? `${appliedFilters.startDate}~${appliedFilters.endDate}`
    : appliedFilters.startDate
      ? `${appliedFilters.startDate}~`
      : appliedFilters.endDate
        ? `~${appliedFilters.endDate}`
        : null
  const activeFilterChips = [
    dateRangeChip,
    appliedFilters.region || null,
    appliedFilters.headCount ? `${appliedFilters.headCount} vs ${appliedFilters.headCount}` : null,
  ].filter(Boolean)


  return (
    <section className="py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="grid gap-2">
          <h2 className="text-3xl font-semibold text-ink">매치 찾기</h2>
          <p className="text-mute">원하는 매치를 찾아 바로 신청해보세요.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex">
          <Button onClick={() => setIsFilterOpen(true)} variant="ghost" className="w-full sm:w-auto px-3">
            필터
          </Button>
          <Button 
            onClick={() => navigate('/matches/map')} 
            variant="ghost" 
            className="w-full sm:w-auto"
          >
            지도로 보기
          </Button>
          <Button onClick={() => navigate('/matches/create')} className="w-full sm:w-auto px-3">
            매치 등록하기
          </Button>
        </div>
      </div>

      {(activeFilterChips.length > 0 || error) && (
        <div className="mb-5 rounded-[24px] border border-gray-100 bg-white/90 p-4 shadow-card">
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilterChips.map((chip) => (
                <span key={chip} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                  {chip}
                </span>
              ))}
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-mute">로딩 중...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-mute">등록된 매치가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-8">
            {groupedMatches.map((group) => (
              <div key={group.date}>
                <h3 className="text-lg font-semibold text-ink mb-3">
                  {formatDateHeader(group.date)}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {group.items.map((match) => (
                    <div
                      key={match.postId}
                      onClick={() => navigate(`/matches/${match.postId}`)}
                      className="rounded-[24px] border border-gray-100 bg-white shadow-card cursor-pointer hover:shadow-lg hover:border-primary-200 transition-all overflow-hidden group"
                    >
                      {/* 헤더 영역 */}
                      <div className="p-4 pb-3">
                        <div className="flex items-start justify-between gap-2 mb-3">
                           <h3 className="line-clamp-2 break-keep text-ink font-semibold text-lg leading-tight flex-1 group-hover:text-primary-600 transition-colors">
                             {match.matchTitle}
                           </h3>
                        {match.postStatus === 'CLOSED' && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full whitespace-nowrap flex-shrink-0">
                              마감
                            </span>
                          )}
                        </div>
                        
                        {/* 경기 인원 배지 */}
                        {match.headCount && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-sm font-medium">{match.headCount} vs {match.headCount}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 구분선 */}
                      <div className="border-t border-gray-100"></div>
                      
                      {/* 정보 영역 */}
                      <div className="p-4 pt-3 space-y-2.5">
                        {/* 장소 */}
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-mute mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                           <span className="line-clamp-2 break-keep text-sm text-ink leading-relaxed">{match.placeName || match.matchAddress}</span>
                        </div>
                        
                        {/* 날짜/시간 */}
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-mute mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-ink">{formatDateDetail(match.matchDate, match.matchTime)}</span>
                      </div>
                        
                        {/* 팀 정보 */}
                        <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-mute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="line-clamp-2 break-keep text-xs text-ink font-medium">{match.teamName}</span>
                          </div>
                          {match.teamLevel && (
                            <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 font-medium rounded-full border border-primary-200">
                              Level {match.teamLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center py-4 pb-28">
            {isLoadingMore ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
                <p className="text-mute text-sm">더 불러오는 중...</p>
              </div>
            ) : isLastPage ? (
              <p className="text-mute text-sm">모든 매치를 확인했습니다.</p>
            ) : (
              <Button onClick={loadMore} variant="ghost" className="w-full max-w-[220px]">
                더 보기
              </Button>
            )}
          </div>
        </>
      )}

      {typeof document !== 'undefined' && createPortal(
        <>
          <button
            type="button"
            onClick={() => setIsRecommendationOpen(true)}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-[max(1rem,calc(50vw-199px))] z-[90] flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#112031_0%,#0f766e_100%)] text-white shadow-[0_16px_36px_rgba(15,23,42,0.24)]"
            aria-label="AI 매치 추천 열기"
          >
            AI
          </button>

          {isRecommendationOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-[95] bg-slate-950/45"
                onClick={() => setIsRecommendationOpen(false)}
                aria-label="AI 추천 닫기"
              />

              <div className="fixed bottom-0 left-1/2 z-[100] w-full max-w-[430px] -translate-x-1/2 rounded-t-[32px] bg-white px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-18px_50px_rgba(15,23,42,0.22)]">
                <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">AI 매치 추천</h3>
                    <p className="mt-1 text-sm text-mute">팀 정보와 요청 내용을 바탕으로 추천 매치를 찾아드립니다.</p>
                  </div>
                  <button type="button" onClick={() => setIsRecommendationOpen(false)} className="inline-flex min-w-[52px] shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-sm leading-none text-mute">
                    닫기
                  </button>
                </div>

                {!user && (
                  <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                    <div className="text-sm font-medium text-ink">로그인 후 이용할 수 있어요</div>
                    <p className="mt-2 text-sm text-mute">AI 추천은 우리 팀 정보를 기반으로 매치를 제안합니다. 로그인 후 이용해주세요.</p>
                    <Button onClick={() => navigate('/login')} className="mt-4 w-full">로그인하기</Button>
                  </div>
                )}

                {user && !canUseRecommendation && (
                  <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                    <div className="text-sm font-medium text-ink">팀이 있어야 추천할 수 있어요</div>
                    <p className="mt-2 text-sm text-mute">AI 추천은 소속 팀의 기준으로 상대 매치를 찾습니다. 팀 생성 또는 팀 가입 후 이용해주세요.</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button onClick={() => navigate('/teams/create')} className="w-full">팀 만들기</Button>
                      <Button variant="ghost" onClick={() => navigate('/teams')} className="w-full">팀 찾기</Button>
                    </div>
                  </div>
                )}

                {canUseRecommendation && (
                  <div className="mt-5">
                    <div className="rounded-3xl bg-[linear-gradient(135deg,#112031_0%,#0f766e_100%)] p-4 text-white">
                      <div className="text-sm font-medium">우리 팀에 맞는 상대를 추천해드릴게요</div>
                      <p className="mt-1 text-sm text-cyan-50/90">예: 이번 주 일요일 오전 경기 가능한 서울 6대6 팀 찾아줘</p>
                      <textarea
                        value={recommendationQuery}
                        onChange={(event) => setRecommendationQuery(event.target.value)}
                        rows={4}
                        placeholder="원하는 일정, 지역, 인원, 분위기를 자연어로 입력해주세요"
                        className="mt-4 w-full resize-none rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-cyan-100/75 focus:outline-none"
                      />
                      <Button type="button" onClick={fetchRecommendations} disabled={isLoadingRecommendations} className="mt-3 w-full border-primary-700 bg-primary-700 text-white hover:bg-primary-800">
                        {isLoadingRecommendations ? '추천 찾는 중...' : '추천 받기'}
                      </Button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {recommendations.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 p-4 text-sm text-mute">
                          추천 결과가 여기에 표시됩니다.
                        </div>
                      ) : (
                        recommendations.slice(0, 5).map((item) => (
                          <button
                            key={`${item.matchId}-${item.teamId}`}
                            type="button"
                            onClick={() => {
                              setIsRecommendationOpen(false)
                              navigate(`/matches/${item.matchId}`)
                            }}
                            className="block w-full rounded-3xl border border-slate-100 bg-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                          >
                            <div className="text-sm font-semibold text-ink">{item.matchTitle}</div>
                            <div className="mt-1 text-xs text-mute">{item.teamName} · {item.matchDate} {item.matchTime}</div>
                            <div className="mt-2 text-sm text-slate-600">{item.reason}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>,
        document.body
      )}

      {isFilterOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-slate-950/45"
            onClick={() => setIsFilterOpen(false)}
            aria-label="필터 닫기"
          />

          <div className="fixed inset-0 z-[70] overflow-y-auto p-4">
            <div ref={filterSheetRef} tabIndex={-1} className="mx-auto my-4 flex w-full max-w-[398px] max-h-[calc(100dvh-2rem)] flex-col rounded-[32px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] focus:outline-none">
            <div className="overflow-y-auto px-5 pb-4 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink">매치 필터</h3>
                <p className="mt-1 text-sm text-mute">조건을 골라 매치를 빠르게 좁혀보세요.</p>
              </div>
              <button type="button" onClick={() => setIsFilterOpen(false)} className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-sm text-mute">
                닫기
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="grid min-w-0 gap-1">
                <span className="text-sm text-mute">시작 날짜</span>
                <input
                  type="date"
                  value={tempFilters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>

              <label className="grid min-w-0 gap-1">
                <span className="text-sm text-mute">종료 날짜</span>
                <input
                  type="date"
                  value={tempFilters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  min={tempFilters.startDate || undefined}
                  className="w-full min-w-0 rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </label>

              <label className="grid min-w-0 gap-1">
                <span className="text-sm text-mute">지역</span>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 p-2">
                  {regions.map((region) => (
                    <button
                      key={region.value || 'all-region'}
                      type="button"
                      onClick={() => handleFilterChange('region', region.value)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${tempFilters.region === region.value ? 'bg-primary-600 text-white' : 'bg-slate-50 text-ink'}`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
              </label>

              <label className="grid min-w-0 gap-1">
                <span className="text-sm text-mute">경기 인원</span>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-gray-200 p-2">
                  {headCountOptions.map((option) => (
                    <button
                      key={option.value || 'all-headcount'}
                      type="button"
                      onClick={() => handleFilterChange('headCount', option.value)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${tempFilters.headCount === option.value ? 'bg-primary-600 text-white' : 'bg-slate-50 text-ink'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-5 py-4">
              <Button variant="ghost" onClick={resetFilters} className="w-full">
                초기화
              </Button>
              <Button onClick={() => { applyFilters(); setIsFilterOpen(false) }} className="w-full">
                적용
              </Button>
            </div>
          </div>
          </div>
        </>
      )}
    </section>
  )
}

export default MatchesPage
