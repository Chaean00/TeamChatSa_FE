import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../shared/store/authStore'
import { useAuth } from '../../shared/hook/useAuth'
import { useUser } from '../../shared/hook/useUser'
import NotificationBell from '../../shared/components/NotificationBell'

const tabs = [
  { to: '/', label: '홈' },
  { to: '/matches', label: '매치' },
  { to: '/teams', label: '팀' },
  { to: '/mypage', label: 'MY' },
]

function Navbar() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { logout } = useAuth()
  const { user } = useUser()
  const isAuthenticated = Boolean(token)

  const handleLogout = async () => {
    await logout()
    alert('로그아웃되었습니다.')
    navigate('/', { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/92 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="min-w-0">
            <div className="truncate text-[18px] font-semibold text-ink">팀찾사</div>
            <div className="text-[12px] text-mute">내 주변 팀과 매치를 가장 빠르게</div>
          </Link>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                <button
                  onClick={() => navigate('/mypage')}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-ink"
                >
                  {(user?.nickname || user?.name || 'U').slice(0, 1)}
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="fixed bottom-4 left-1/2 z-50 flex w-[calc(min(100vw,430px)-24px)] -translate-x-1/2 items-center justify-between rounded-full border border-slate-200 bg-white/96 px-2 py-2 shadow-[0_12px_32px_rgba(15,23,42,0.18)] backdrop-blur">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex min-w-[72px] justify-center rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-primary-600 text-white' : 'text-mute'}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {isAuthenticated && (
        <div className="px-4 pt-3 text-xs text-mute">
          {(user?.nickname || user?.name) && <span>{user?.nickname || user?.name} 님</span>}
          <button onClick={handleLogout} className="ml-3 font-medium text-primary-600">
            로그아웃
          </button>
        </div>
      )}
    </>
  )
}

export default Navbar
