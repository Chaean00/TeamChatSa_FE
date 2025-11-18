import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import Button from '../shared/ui/Button.jsx'

function TeamsPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [isLastPage, setIsLastPage] = useState(false)
  const observerTarget = useRef(null)

  const fetchTeams = useCallback(
    async (pageNum = 0) => {
      const isInitial = pageNum === 0
      try {
        if (isInitial) {
          setIsLoading(true)
        } else {
          setIsLoadingMore(true)
        }
        setError(null)
        const res = await api.get('/v1/teams', {
          params: {
            page: pageNum,
            size: 20,
          },
        })
        const responseData = res.data?.data
        const teamsData = responseData?.content || []
        const last = responseData?.last ?? false

        setTeams((prev) => (isInitial ? teamsData : [...prev, ...teamsData]))
        setIsLastPage(last)
      } catch (e) {
        const errorMessage = e.response?.data?.message || e.message || '팀 목록을 불러오는데 실패했습니다.'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchTeams(page)
  }, [page, fetchTeams])

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isLastPage) {
      setPage((prev) => prev + 1)
    }
  }, [isLoadingMore, isLastPage])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isLastPage) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [loadMore, isLoadingMore, isLastPage])

  return (
    <section className="py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="grid gap-2">
          <h2 className="text-3xl font-semibold text-ink">팀 찾기</h2>
          <p className="text-mute">다양한 팀을 찾아보고 가입 신청을 해보세요.</p>
        </div>
        <Link to="/teams/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">팀 생성하기</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-mute">로딩 중...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-600">{error}</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-mute">등록된 팀이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => navigate(`/teams/${team.id}`)}
                className="rounded-xl border border-gray-100 p-4 bg-white/70 shadow-card cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="w-full h-40 mb-3 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {team.img ? (
                    <img
                      src={team.img}
                      alt={team.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-2xl">
                        {team.name ? team.name.charAt(0).toUpperCase() : 'T'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-ink font-medium text-lg mb-1">{team.name}</div>
                <div className="text-mute text-sm mb-2">{team.area}</div>
                {team.description && (
                  <div className="text-mute text-sm mb-2 line-clamp-2">{team.description}</div>
                )}
                <div className="text-mute text-xs">멤버 {team.memberCount}명</div>
              </div>
            ))}
          </div>
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            {isLoadingMore && (
              <p className="text-mute text-sm">더 불러오는 중...</p>
            )}
            {isLastPage && teams.length > 0 && (
              <p className="text-mute text-sm">모든 팀을 불러왔습니다.</p>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default TeamsPage

