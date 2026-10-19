import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

/** Session Supabase courante ; loading tant que la session n'est pas connue. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!!supabase)

  useEffect(() => {
    if (!supabase) return
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => {
      alive = false
      data.subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}

export const signIn = (email: string, password: string) => supabase!.auth.signInWithPassword({ email, password })

export const signUp = (email: string, password: string) => supabase!.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })

export const resetPassword = (email: string) => supabase!.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })

export const signOut = () => supabase?.auth.signOut()
