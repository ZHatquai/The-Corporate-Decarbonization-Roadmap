import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { homePathForRole } from '../lib/roles'
import Logo from '../components/brand/Logo'
import Button from '../components/brand/Button'
import Card from '../components/brand/Card'
import LoadingScreen from '../components/LoadingScreen'

// Signed in, but no user_roles row. RLS returns zero data; the person needs an
// invite from the ESG lead (Settings -> Users).
export default function AccessNotProvisioned() {
  const { loading, session, role, email, signOut } = useAuth()

  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (role) return <Navigate to={homePathForRole(role)} replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-chalk px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Logo size={32} />
        </div>
        <Card elevated>
          <p className="tc-label mb-3">Access not provisioned</p>
          <h1 className="tc-h2 mb-4">You are signed in, but not yet set up.</h1>
          <p className="tc-body">
            {email ? <span className="font-medium">{email}</span> : 'This account'} has no role on
            the Decarbonization Roadmap. Ask the ESG lead to invite you from Settings → Users, then
            sign in again.
          </p>
          <div className="mt-8">
            <Button variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
