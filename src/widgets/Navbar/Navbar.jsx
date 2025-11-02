import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../shared/store/authStore'
import { useAuth } from '../../shared/hook/useAuth'
import { useUser } from '../../shared/hook/useUser'

function Navbar() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { logout } = useAuth()
  const { user } = useUser()
  const isAuthenticated = Boolean(token)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
      <nav className="max-w-[1120px] mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-500 inline-block" />
          <span className="text-[15px] font-semibold tracking-tight text-ink">팀찾사 : 팀을 찾는 사람들</span>
        </Link>
        <div className="flex items-center gap-5 text-[14px]">
          <NavLink to="/matches" className={({isActive}) => isActive ? 'text-primary-600' : 'text-ink'}>매치찾기</NavLink>
          <NavLink to="/teams" className={({isActive}) => isActive ? 'text-primary-600' : 'text-ink'}>팀찾기</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/teams/create" className={({isActive}) => isActive ? 'text-primary-600' : 'text-ink'}>팀 생성</NavLink>
              <NavLink to="/mypage" className={({isActive}) => isActive ? 'text-primary-600' : 'text-ink'}>마이페이지</NavLink>
              {(user?.userName || user?.name) && (
                <span className="text-mute">{user?.userName || user?.name} 님</span>
              )}
              <button onClick={handleLogout} className="text-ink hover:text-primary-600">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({isActive}) => isActive ? 'text-primary-600' : 'text-ink'}>로그인</NavLink>
              <NavLink to="/signup" className={({isActive}) => isActive ? 'text-primary-600' : 'text-ink'}>회원가입</NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Navbar

