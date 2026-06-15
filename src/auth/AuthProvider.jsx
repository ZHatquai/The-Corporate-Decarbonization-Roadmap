import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// Provides the Supabase session plus the caller's own role row. Role is resolved
// with an own-row select on user_roles (RLS policy user_roles_self_read), NOT via
// the ec_private.* helpers, which live in a private schema and are not REST-exposed.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  // role: undefined = not yet resolved, null = signed in but no role row, string = role
  const [role, setRole] = useState(undefined)
  const [plantId, setPlantId] = useState(null)
  const [profileEmail, setProfileEmail] = useState(null)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const uid = session?.user?.id ?? null

  useEffect(() => {
    let active = true
    if (!uid) {
      setRole(undefined)
      setPlantId(null)
      setProfileEmail(null)
      return
    }
    setRole(undefined) // re-resolving
    supabase
      .from('user_roles')
      .select('role, plant_id, email')
      .eq('user_id', uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          // eslint-disable-next-line no-console
          console.error('Role lookup failed:', error.message)
          setRole(null)
          setPlantId(null)
          setProfileEmail(null)
        } else {
          setRole(data?.role ?? null)
          setPlantId(data?.plant_id ?? null)
          setProfileEmail(data?.email ?? null)
        }
      })
    return () => {
      active = false
    }
  }, [uid])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const resolvingRole = !!uid && role === undefined

  const value = {
    session,
    user: session?.user ?? null,
    email: session?.user?.email ?? profileEmail ?? null,
    role: role ?? null,
    plantId,
    authReady,
    loading: !authReady || resolvingRole,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
