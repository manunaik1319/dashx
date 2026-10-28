import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { ensureDefaultCategories, isDemoMode, setDemoMode } from '../services/db'

export const DEMO_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: { provider: 'demo' },
  user_metadata: { full_name: 'Demo User' },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
  email: 'demo@dashx.com',
} as User

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  isDemo: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  signInDemo: () => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isDemo, setIsDemoState] = useState<boolean>(isDemoMode())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If in demo mode, hydrate demo user
    if (isDemoMode()) {
      setUser(DEMO_USER)
      setIsDemoState(true)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isDemoMode()) {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          ensureDefaultCategories(session.user.id).catch(() => {})
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    setDemoMode(false)
    setIsDemoState(false)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string) {
    setDemoMode(false)
    setIsDemoState(false)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return {
      needsConfirmation: !data.session,
    }
  }

  function signInDemo() {
    setDemoMode(true)
    setIsDemoState(true)
    setUser(DEMO_USER)
    setSession(null)
  }

  async function signOut() {
    if (isDemoMode()) {
      setDemoMode(false)
      setIsDemoState(false)
      setUser(null)
      return
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemo, signIn, signUp, signInDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
