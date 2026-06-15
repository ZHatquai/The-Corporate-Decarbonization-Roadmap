import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { homePathForRole } from '../lib/roles'
import LoadingScreen from './LoadingScreen'

// Sends each visitor to the right place: login, access screen, or their role home.
export default function HomeRedirect() {
  const { loading, session, role } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (!role) return <Navigate to="/access" replace />
  return <Navigate to={homePathForRole(role)} replace />
}
