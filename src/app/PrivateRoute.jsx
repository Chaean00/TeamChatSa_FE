import { Navigate, useLocation } from 'react-router-dom'
import { getAuthToken } from '../shared/store/authStore'

function PrivateRoute({ children }) {
  const isAuthed = Boolean(getAuthToken())
  const location = useLocation()
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}

export default PrivateRoute
