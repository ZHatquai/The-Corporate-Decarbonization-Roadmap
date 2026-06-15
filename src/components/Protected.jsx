import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { homePathForRole } from '../lib/roles'
import LoadingScreen from './LoadingScreen'

// Route guard: requires a session and (optionally) a role in `allow`.
// - no session  -> /login
// - no role row -> /access (signed in but not provisioned)
// - wrong role  -> that role's home
export default function Protected({ allow }) {
  const { loading, session, role } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!role) return <Navigate to="/access" replace />
  if (allow && !allow.includes(role)) return <Navigate to={homePathForRole(role)} replace />

  return <Outlet />
}
