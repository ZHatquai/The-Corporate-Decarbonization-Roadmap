import { createClient } from '@supabase/supabase-js'

// Frontend uses the anon (public) key ONLY. RLS enforces all access.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Surface a clear message rather than failing with an opaque network error.
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Set them in a local .env (copy .env.example) or as Netlify environment variables.',
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // completes the magic-link sign-in on redirect
  },
})
