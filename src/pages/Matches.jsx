import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import Button from '../shared/ui/Button.jsx'

function MatchesPage() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [isLastPage, setIsLastPage] = useState(false)
  const observerTarget = useRef(null)

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
  
  // 한국 시도 목록
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
    { value: '충북', label: '충북' },
    { value: '충남', label: '충남' },
    { value: '전북', label: '전북' },
    { value: '전남', label: '전남' },
    { value: '경북', label: '경북' },
    { value: '경남', label: '경남' },
    { value: '제주', label: '제주' },
  ]

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isLoading && !isLastPage) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMatches(nextPage)
    }
  }, [isLoadingMore, isLastPage, isLoading, page, fetchMatches])

  // IntersectionObserver 설정
  useEffect(() => {
    // 마지막 페이지이거나 로딩 중이면 observer 설정하지 않음
    if (isLastPage || isLoading) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isLastPage && !isLoading) {
          loadMore()
        }
      },
      { 
        threshold: 1.0 // 요소가 완전히 보일 때 트리거 (맨 아래로 내려야 로딩)
      }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [loadMore, isLoadingMore, isLastPage, isLoading])

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


  return (
    <section className="py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="grid gap-2">
          <h2 className="text-3xl font-semibold text-ink">매치 찾기</h2>
          <p className="text-mute">다양한 매치를 찾아보고 신청해보세요.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/matches/map')} 
            variant="ghost" 
            className="w-full sm:w-auto"
          >
            지도로 보기
          </Button>
          <Button onClick={() => navigate('/matches/create')} className="w-full sm:w-auto">
            매치 등록하기
          </Button>
        </div>
      </div>

      {/* 필터 섹션 */}
      <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6 mb-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">필터</h3>
            <button
              onClick={resetFilters}
              className="text-sm text-mute hover:text-ink transition-colors"
            >
              초기화
            </button>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 날짜 범위 필터 */}
            <label className="grid gap-1">
              <span className="text-sm text-mute">시작 날짜</span>
              <input
                type="date"
                value={tempFilters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
              />
            </label>
            
            <label className="grid gap-1">
              <span className="text-sm text-mute">종료 날짜</span>
              <input
                type="date"
                value={tempFilters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={tempFilters.startDate || undefined}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
              />
            </label>
            
            {/* 지역 필터 */}
            <label className="grid gap-1">
              <span className="text-sm text-mute">지역</span>
              <select
                value={tempFilters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
              >
                {regions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </label>
            
            {/* 인원 필터 */}
            <label className="grid gap-1">
              <span className="text-sm text-mute">경기 인원</span>
              <select
                value={tempFilters.headCount}
                onChange={(e) => handleFilterChange('headCount', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
              >
                <option value="">전체</option>
                <option value="4">4 vs 4</option>
                <option value="5">5 vs 5</option>
                <option value="6">6 vs 6</option>
                <option value="7">7 vs 7</option>
                <option value="8">8 vs 8</option>
                <option value="9">9 vs 9</option>
                <option value="10">10 vs 10</option>
                <option value="11">11 vs 11</option>
              </select>
            </label>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button onClick={applyFilters} className="px-6">
              적용
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-mute">로딩 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-600">{error}</p>
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
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((match) => (
                    <div
                      key={match.postId}
                      onClick={() => navigate(`/matches/${match.postId}`)}
                      className="rounded-xl border border-gray-100 bg-white shadow-card cursor-pointer hover:shadow-lg hover:border-primary-200 transition-all overflow-hidden group"
                    >
                      {/* 헤더 영역 */}
                      <div className="p-4 pb-3">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-ink font-semibold text-lg leading-tight flex-1 group-hover:text-primary-600 transition-colors">
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
                          <span className="text-sm text-ink leading-relaxed">{match.placeName || match.matchAddress}</span>
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
                            <span className="text-xs text-ink font-medium">{match.teamName}</span>
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
          <div ref={observerTarget} className="h-20 flex items-center justify-center py-4">
            {isLoadingMore && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
                <p className="text-mute text-sm">더 불러오는 중...</p>
              </div>
            )}
            {isLastPage && matches.length > 0 && !isLoadingMore && (
              <p className="text-mute text-sm">모든 매치를 불러왔습니다.</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default MatchesPage

