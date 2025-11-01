import { Navigate, useLocation } from 'react-router-dom'
import { getAuthToken } from '../shared/store/authStore'

function PrivateRoute({ children }) {
  const isAuthed = Boolean(getAuthToken())
  const location = useLocation()
  if (!isAuthed) {
    if (typeof window !== 'undefined') {
      // 간단 알림 후 로그인으로 이동
      alert('로그인이 필요합니다.')
    }
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

export default PrivateRoute

