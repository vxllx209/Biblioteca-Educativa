import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { DEMO_USER, USERS } from '../data/mock'
import { usePersistentState } from '../hooks/usePersistentState'
import type { PlanId, User } from '../types'

type Result = { ok: true } | { ok: false; error: string }

interface AuthValue {
  user: User | null
  isAuthenticated: boolean
  isPremium: boolean
  login: (email: string, password: string) => Promise<Result>
  loginWithGoogle: () => Promise<Result>
  register: (data: { fullName: string; email: string; password: string }) => Promise<Result>
  requestPasswordReset: (email: string) => Promise<Result>
  logout: () => void
  updateUser: (patch: Partial<Omit<User, 'id' | 'password'>>) => Promise<Result>
  changePassword: (current: string, next: string) => Promise<Result>
  setPlan: (plan: PlanId) => void
}

const AuthContext = createContext<AuthValue | null>(null)

const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms))
const AVATAR_COLORS = ['#4F806D', '#285B4A', '#9C6450', '#3F5560', '#6B7448', '#C18A45']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = usePersistentState<User[]>('users', () => USERS)
  const [sessionId, setSessionId] = usePersistentState<string | null>('session', () => null)

  const user = useMemo(() => users.find((u) => u.id === sessionId) ?? null, [users, sessionId])

  const patchUser = useCallback(
    (id: string, patch: Partial<User>) => setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u))),
    [setUsers],
  )

  const login = useCallback<AuthValue['login']>(
    async (email, password) => {
      await wait()
      const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!found || found.password !== password) return { ok: false, error: 'Correo o contraseña incorrectos.' }
      setSessionId(found.id)
      return { ok: true }
    },
    [users, setSessionId],
  )

  const loginWithGoogle = useCallback<AuthValue['loginWithGoogle']>(async () => {
    // Simulated OAuth: signs in with the demo Google account.
    await wait(700)
    const existing = users.find((u) => u.id === DEMO_USER.id)
    if (!existing) setUsers((list) => [...list, DEMO_USER])
    setSessionId(DEMO_USER.id)
    return { ok: true }
  }, [users, setUsers, setSessionId])

  const register = useCallback<AuthValue['register']>(
    async ({ fullName, email, password }) => {
      await wait()
      const normalized = email.trim().toLowerCase()
      if (users.some((u) => u.email.toLowerCase() === normalized))
        return { ok: false, error: 'Ya existe una cuenta con este correo.' }
      const [firstName, ...rest] = fullName.trim().split(/\s+/)
      const newUser: User = {
        id: `u-${Date.now().toString(36)}`,
        firstName,
        lastName: rest.join(' '),
        email: normalized,
        password,
        role: 'Estudiante',
        avatarColor: AVATAR_COLORS[users.length % AVATAR_COLORS.length],
        plan: 'free',
        createdAt: new Date().toISOString(),
        provider: 'email',
      }
      setUsers((list) => [...list, newUser])
      setSessionId(newUser.id)
      return { ok: true }
    },
    [users, setUsers, setSessionId],
  )

  const requestPasswordReset = useCallback<AuthValue['requestPasswordReset']>(async () => {
    // Never reveal whether an account exists for the address.
    await wait(800)
    return { ok: true }
  }, [])

  const logout = useCallback(() => setSessionId(null), [setSessionId])

  const updateUser = useCallback<AuthValue['updateUser']>(
    async (patch) => {
      if (!user) return { ok: false, error: 'No hay sesión activa.' }
      await wait(500)
      if (patch.email) {
        const normalized = patch.email.trim().toLowerCase()
        if (users.some((u) => u.id !== user.id && u.email.toLowerCase() === normalized))
          return { ok: false, error: 'Ese correo ya está en uso.' }
        patch = { ...patch, email: normalized }
      }
      patchUser(user.id, patch)
      return { ok: true }
    },
    [user, users, patchUser],
  )

  const changePassword = useCallback<AuthValue['changePassword']>(
    async (current, next) => {
      if (!user) return { ok: false, error: 'No hay sesión activa.' }
      await wait(500)
      if (user.password !== current) return { ok: false, error: 'La contraseña actual no es correcta.' }
      patchUser(user.id, { password: next })
      return { ok: true }
    },
    [user, patchUser],
  )

  const setPlan = useCallback((plan: PlanId) => user && patchUser(user.id, { plan }), [user, patchUser])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isPremium: !!user && user.plan !== 'free',
      login,
      loginWithGoogle,
      register,
      requestPasswordReset,
      logout,
      updateUser,
      changePassword,
      setPlan,
    }),
    [user, login, loginWithGoogle, register, requestPasswordReset, logout, updateUser, changePassword, setPlan],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
