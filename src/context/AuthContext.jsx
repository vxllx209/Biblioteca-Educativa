import { createContext, useContext, useEffect, useState } from 'react'
import { backend } from '../lib/backend.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    backend.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setReady(true)
    })
    const { data } = backend.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    ready,
    signIn: (email, password) => backend.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => backend.auth.signUp({ email, password }),
    signOut: () => backend.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
