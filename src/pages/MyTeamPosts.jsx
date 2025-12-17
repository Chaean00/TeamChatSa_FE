import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../shared/hook/useUser'
import { api } from '../shared/api/client'
import Button from '../shared/ui/Button.jsx'

const PAGE_SIZE = 6

function MyTeamPostsPage() {
  const navigate = useNavigate()
  const { user, isLoading: isUserLoading } = useUser()
  const [team, setTeam] = useState(null)
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(0)
  const [isLastPage, setIsLastPage] = useState(false)
  const [isLoadingTeam, setIsLoadingTeam] = useState(true)
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
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
        const res = await api.get(`/v1/teams/${user.teamId}`)
        setTeam(res.data?.data)
      } catch (e) {
        setError(e.response?.data?.message || e.message || '팀 정보를 불러오지 못했습니다.')
        setTeam(null)
      } finally {
        setIsLoadingTeam(false)
      }
    }

    fetchTeam()
  }, [user?.teamId])

  useEffect(() => {
    if (team?.id) {
      loadPosts(0, true)
    }
  }, [team?.id])

  const loadPosts = async (pageToLoad = 0, replace = false) => {
    if (!team?.id) return

    try {
      setIsLoadingPosts(true)
      const res = await api.get(`/v1/matches/${team.id}/team-posts`, {
        params: { page: pageToLoad, size: PAGE_SIZE },
      })
      const data = res.data?.data
      const content = data?.content || []
      setPosts(prev => (replace ? content : [...prev, ...content]))
      setPage(pageToLoad)
      setIsLastPage(data?.last ?? true)
    } catch (e) {
      setError(e.response?.data?.message || e.message || '팀 게시글을 불러오지 못했습니다.')
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return dateString
    }
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}월 ${day}일`
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
          <Button variant="ghost" onClick={() => loadPosts(page, true)}>다시 불러오기</Button>
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

        <p className="text-sm text-mute mb-4">팀이 등록한 매치 게시글 목록입니다. 곧 페이지네이션이 추가될 예정이에요.</p>

        {posts.length === 0 ? (
          <p className="text-mute text-sm">등록된 게시글이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.postId} className="p-4 border border-gray-100 rounded-xl flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-mute">{formatDate(post.matchDate)} {post.matchTime}</p>
                  <p className="text-lg font-semibold text-ink mt-1">{post.matchTitle}</p>
                  <p className="text-sm text-mute mt-1">{post.placeName || post.matchAddress}</p>
                  <p className="text-xs text-mute mt-1">상태: {post.postStatus === 'OPEN' ? '모집 중' : '마감'}</p>
                </div>
                <Button variant="ghost" onClick={() => navigate(`/matches/${post.postId}`)}>상세보기</Button>
              </div>
            ))}
          </div>
        )}

        {!isLastPage && (
          <div className="mt-6 text-center">
            <Button onClick={() => loadPosts(page + 1)} disabled={isLoadingPosts}>
              {isLoadingPosts ? '불러오는 중...' : '더 보기'}
            </Button>
          </div>
        )}
      </>
    )
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-gray-100 bg-white/80 shadow-card p-6">
          <h1 className="text-2xl font-semibold text-ink mb-2">팀 게시글</h1>
          {renderContent()}
        </div>
      </div>
    </section>
  )
}

export default MyTeamPostsPage

