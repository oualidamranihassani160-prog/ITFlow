import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

export default function PrivateRoute({ children }) {
  const { user, token } = useSelector(s => s.auth)
  const location = useLocation()

  if (!token && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
