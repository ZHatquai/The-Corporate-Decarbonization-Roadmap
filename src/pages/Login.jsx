import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import Logo from '../components/brand/Logo'
import Button from '../components/brand/Button'
import Card from '../components/brand/Card'
import Field from '../components/brand/Field'
import { Input } from '../components/brand/Input'
import LoadingScreen from '../components/LoadingScreen'

// Magic-link sign-in. Invite-only access is enforced by the membership table + RLS,
// not by this form: a signed-in account with no user_roles row lands on /access.
export default function Login() {
  const { loading, session } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')

  if (loading) return <LoadingScreen />
  // Already signed in — let the home redirect route by role.
  if (session) return <Navigate to="/" replace />

  async function onSubmit(e) {
    e.preventDefault()
    const clean = email.trim().toLowerCase()
    if (!clean) return
    setStatus('sending')
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: clean,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    if (err) {
      setError(err.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-chalk px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center gap-6 text-center">
          <Logo size={32} />
          <div>
            <p className="tc-label mb-2">Decarbonization Roadmap</p>
            <h1 className="tc-h2">Sign in</h1>
          </div>
        </div>

        <Card elevated>
          {status === 'sent' ? (
            <div className="text-center">
              <p className="tc-h3 mb-3">Check your email</p>
              <p className="tc-body">
                A sign-in link is on its way to{' '}
                <span className="font-medium">{email.trim().toLowerCase()}</span>. Open it on this
                device to continue.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-6 font-sans text-[13px] text-ink"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              <p className="tc-body">
                Enter your work email. We will send a one-time sign-in link. Access is
                invite-only.
              </p>
              <Field label="Work email" htmlFor="email" error={status === 'error' ? error : ''}>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@thecorporate.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Button type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
