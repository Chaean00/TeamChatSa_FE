import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../shared/api/client'
import { getErrorMessage } from '../shared/lib/errorMessage'
import Button from '../shared/ui/Button.jsx'

function getTeamInitial(name) {
  return name ? name.trim().charAt(0).toUpperCase() : 'T'
}

function TeamsPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [isLastPage, setIsLastPage] = useState(false)
  const observerTarget = useRef(null)

  // 검색 필터 상태 (입력 중인 필터)
  const [tempTeamName, setTempTeamName] = useState('')
  
  // 적용된 검색 필터 상태
  const [appliedTeamName, setAppliedTeamName] = useState('')

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
        
        const params = {
          page: pageNum,
          size: 20,
        }
        
        // 검색 필터 파라미터 추가
        if (appliedTeamName) {
          params.teamName = appliedTeamName
        }
        
        const res = await api.get('/v1/teams', { params })
        const responseData = res.data?.data
        const teamsData = responseData?.content || []
        const last = responseData?.last ?? false

        setTeams((prev) => (isInitial ? teamsData : [...prev, ...teamsData]))
        setIsLastPage(last)
      } catch (e) {
        setError(getErrorMessage(e, '팀 목록을 불러오지 못했습니다.'))
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [appliedTeamName]
  )

  // 적용된 검색 필터 변경 시 검색 실행 (초기 로드 포함)
  useEffect(() => {
    setPage(0)
    setTeams([])
    setIsLastPage(false)
    fetchTeams(0)
  }, [appliedTeamName, fetchTeams])

  // page 변경 시 다음 페이지 로드
  useEffect(() => {
    if (page > 0) {
      fetchTeams(page)
    }
  }, [page, fetchTeams])

  const handleTeamNameChange = (value) => {
    setTempTeamName(value)
  }
  
  const applySearch = () => {
    setAppliedTeamName(tempTeamName)
    setPage(0)
    setTeams([])
    setIsLastPage(false)
  }
  
  const resetSearch = () => {
    setTempTeamName('')
    setAppliedTeamName('')
    setPage(0)
    setTeams([])
    setIsLastPage(false)
  }

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isLastPage && !isLoading) {
      setPage((prev) => prev + 1)
    }
  }, [isLoadingMore, isLastPage, isLoading])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isLastPage) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const target = observerTarget.current

    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [loadMore, isLoadingMore, isLastPage])

  return (
    <section className="py-10 sm:py-14">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2">
          <h2 className="text-3xl font-semibold text-ink">팀 찾기</h2>
          <p className="text-mute">원하는 팀을 찾아 가입을 신청해보세요.</p>
        </div>
        <Link to="/teams/create" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto px-3">팀 생성하기</Button>
        </Link>
      </div>

      <div className="mb-6 rounded-[28px] border border-gray-100 bg-white/90 p-5 shadow-card">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ink">팀 검색</h3>
            {appliedTeamName && (
              <button
                onClick={resetSearch}
                className="text-sm text-mute transition-colors hover:text-ink"
              >
                초기화
              </button>
            )}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              type="text"
              placeholder="팀 이름을 입력하세요"
              value={tempTeamName}
              onChange={(e) => handleTeamNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applySearch()
                }
              }}
              className="min-w-0 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <Button onClick={applySearch} className="px-4">
              검색
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-10 text-center">
          <p className="text-mute">로딩 중...</p>
        </div>
      ) : error ? (
        <div className="py-10 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-mute">
            {appliedTeamName ? `"${appliedTeamName}"에 대한 검색 결과가 없습니다.` : '등록된 팀이 없습니다.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => navigate(`/teams/${team.id}`)}
                className="w-full cursor-pointer rounded-[28px] border border-gray-100 bg-white/88 p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-100 hover:shadow-lg sm:p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[22px] bg-slate-100 ring-1 ring-black/5 sm:h-28 sm:w-28">
                    {team.img ? (
                      <img
                        src={team.img}
                        alt={team.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#cffafe_0%,#ecfeff_100%)]">
                        <span className="text-3xl font-semibold text-primary-700">
                          {getTeamInitial(team.name)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="line-clamp-2 break-keep text-xl font-semibold leading-tight text-ink">
                          {team.name}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            {team.area || '지역 미정'}
                          </span>
                          <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">
                            멤버 {team.memberCount ?? 0}명
                          </span>
                          {team.levelLabel && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                              {team.levelLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-mute sm:block">
                        상세보기
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 break-keep text-sm leading-6 text-mute">
                      {team.description || '아직 등록된 팀 소개가 없습니다. 팀 상세에서 더 많은 정보를 확인해보세요.'}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                      <span className="text-mute">탭해서 팀 정보 보기</span>
                      <span className="font-medium text-primary-600">자세히 보기 →</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div ref={observerTarget} className="flex h-12 items-center justify-center">
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
