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
        const res = await api.get('/v1/matches', {
          params: {
            page: pageNum,
            size: 20,
          },
        })
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
    []
  )

  // 초기 로드
  useEffect(() => {
    fetchMatches(0)
  }, [fetchMatches])

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isLastPage && !isLoading) {
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
        <Button onClick={() => navigate('/matches/create')} className="w-full sm:w-auto">
          매치 등록하기
        </Button>
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
                      className="rounded-xl border border-gray-100 p-4 bg-white/70 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-ink font-medium text-lg">{match.matchTitle}</div>
                        {match.postStatus === 'CLOSED' && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">마감</span>
                        )}
                      </div>
                      <div className="text-mute text-sm mb-1">{match.placeName || match.matchAddress}</div>
                      <div className="text-mute text-sm mb-1">
                        {formatDateDetail(match.matchDate, match.matchTime)}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-mute text-xs">{match.teamName}</div>
                        {match.teamLevel && (
                          <div className="text-mute text-xs">레벨: {match.teamLevel}</div>
                        )}
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

