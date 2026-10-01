import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Lang, Profile } from './types'

interface Ctx {
  session: Session | null
  profile: Profile | null
  loading: boolean
  lang: Lang
  refresh: () => Promise<void>
}

const SessionContext = createContext<Ctx>({
  session: null,
  profile: null,
  loading: true,
  lang: 'sk',
  refresh: async () => {},
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile((data as Profile) ?? null)
  }

  async function refresh() {
    if (session?.user.id) await loadProfile(session.user.id)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user.id) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s?.user.id) await loadProfile(s.user.id)
      else setProfile(null)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const lang: Lang = profile?.lang ?? (navigator.language.startsWith('sk') ? 'sk' : 'en')

  return (
    <SessionContext.Provider value={{ session, profile, loading, lang, refresh }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
