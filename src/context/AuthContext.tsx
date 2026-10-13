import type { Session, SupabaseClient, User as AuthUser } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEMO_USER, USERS } from '../data/mock'
import { usePersistentState } from '../hooks/usePersistentState'
import { supabase } from '../lib/supabase'
import type { PlanId, Role, User } from '../types'
import { t } from '../i18n'

type Result = { ok: true; notice?: string } | { ok: false; error: string }

interface AuthValue {
  /** False until the initial session has been restored. */
  ready: boolean
  user: User | null
  isAuthenticated: boolean
  isPremium: boolean
  /** The user arrived from a password-reset link and must choose a new password. */
  passwordRecovery: boolean
  login: (email: string, password: string) => Promise<Result>
  loginWithGoogle: () => Promise<Result>
  register: (data: RegisterData) => Promise<Result>
  requestPasswordReset: (email: string) => Promise<Result>
  completePasswordReset: (next: string) => Promise<Result>
  logout: () => void
  updateUser: (patch: Partial<Omit<User, 'id' | 'password'>>) => Promise<Result>
  changePassword: (current: string, next: string) => Promise<Result>
  setPlan: (plan: PlanId) => void
}

/** Exactly what the sign-up form collects: the auth credentials plus the profile columns. */
export interface RegisterData {
  fullName: string
  email: string
  password: string
  role: Role
  school?: string
  subject?: string
}

const AuthContext = createContext<AuthValue | null>(null)

const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms))
const AVATAR_COLORS = ['#4F806D', '#285B4A', '#9C6450', '#3F5560', '#6B7448', '#C18A45']

/** Local mode: accounts and session live in localStorage (no backend configured). */
function useLocalAuth(): AuthValue {
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
      if (!found || found.password !== password) return { ok: false, error: t('Correo o contraseña incorrectos.') }
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
    async ({ fullName, email, password, role, school, subject }) => {
      await wait()
      const normalized = email.trim().toLowerCase()
      if (users.some((u) => u.email.toLowerCase() === normalized))
        return { ok: false, error: t('Ya existe una cuenta con este correo.') }
      const [firstName, ...rest] = fullName.trim().split(/\s+/)
      const newUser: User = {
        id: `u-${Date.now().toString(36)}`,
        firstName,
        lastName: rest.join(' '),
        email: normalized,
        password,
        role,
        ...(role === 'Profesor' ? { school: school?.trim() ?? '', subject: subject ?? '' } : {}),
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
      if (!user) return { ok: false, error: t('No hay sesión activa.') }
      await wait(500)
      if (patch.email) {
        const normalized = patch.email.trim().toLowerCase()
        if (users.some((u) => u.id !== user.id && u.email.toLowerCase() === normalized))
          return { ok: false, error: t('Ese correo ya está en uso.') }
        patch = { ...patch, email: normalized }
      }
      patchUser(user.id, patch)
      return { ok: true }
    },
    [user, users, patchUser],
  )

  const changePassword = useCallback<AuthValue['changePassword']>(
    async (current, next) => {
      if (!user) return { ok: false, error: t('No hay sesión activa.') }
      await wait(500)
      if (user.password !== current) return { ok: false, error: t('La contraseña actual no es correcta.') }
      patchUser(user.id, { password: next })
      return { ok: true }
    },
    [user, patchUser],
  )

  const setPlan = useCallback((plan: PlanId) => user && patchUser(user.id, { plan }), [user, patchUser])

  return useMemo<AuthValue>(
    () => ({
      ready: true,
      passwordRecovery: false,
      completePasswordReset: async () => ({ ok: false, error: t('No disponible sin conexión al servidor.') }),
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
}

/* ---------- Supabase mode ---------- */

interface ProfileRow {
  id: string
  first_name: string
  last_name: string
  role: Role
  school?: string
  subject?: string
  avatar_color: string
  avatar_url: string | null
  plan: PlanId
  provider: 'email' | 'google'
  created_at: string
}

/** Used when the profile row can't be read (e.g. the migration hasn't been applied yet). */
function profileFromAuth(u: AuthUser): ProfileRow {
  const meta = u.user_metadata ?? {}
  const [first = '', ...rest] = String(meta.full_name ?? meta.name ?? '').trim().split(/\s+/)
  return {
    id: u.id,
    first_name: meta.first_name ?? first,
    last_name: meta.last_name ?? rest.join(' '),
    role: meta.role === 'Profesor' ? 'Profesor' : 'Estudiante',
    school: meta.school ?? '',
    subject: meta.subject ?? '',
    avatar_color: AVATAR_COLORS[0],
    avatar_url: meta.avatar_url ?? null,
    plan: 'free',
    provider: u.app_metadata?.provider === 'google' ? 'google' : 'email',
    created_at: u.created_at,
  }
}

async function fetchProfile(client: SupabaseClient, u: AuthUser): Promise<ProfileRow> {
  const { data } = await client.from('profiles').select('*').eq('id', u.id).maybeSingle<ProfileRow>()
  if (!data) return profileFromAuth(u)
  // The role chosen at sign-up travels in the auth metadata; if the profile missed it (older trigger), repair it.
  const meta = u.user_metadata ?? {}
  if ((meta.role === 'Profesor' || meta.role === 'Estudiante') && data.role !== meta.role) {
    const fix: Partial<ProfileRow> = { role: meta.role, school: meta.school ?? '', subject: meta.subject ?? '' }
    const full = await client.from('profiles').update(fix).eq('id', u.id)
    // Without the classroom migration the school/subject columns don't exist yet: save at least the role.
    if (full.error) await client.from('profiles').update({ role: meta.role }).eq('id', u.id)
    return { ...data, ...fix }
  }
  return data
}

function translateError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return t('Correo o contraseña incorrectos.')
  if (m.includes('email not confirmed')) return t('Confirma tu correo antes de iniciar sesión (revisa tu bandeja de entrada).')
  if (m.includes('already registered') || m.includes('already been registered')) return t('Ya existe una cuenta con este correo.')
  if (m.includes('password should be') || m.includes('weak password')) return t('La contraseña es demasiado débil.')
  if (m.includes('rate limit') || m.includes('security purposes')) return t('Demasiados intentos. Espera un momento e inténtalo de nuevo.')
  if (m.includes('fetch')) return t('No pudimos conectar con el servidor. Revisa tu conexión.')
  return message
}

const fail = (error: { message: string }): Result => ({ ok: false, error: translateError(error.message) })
const appUrl = (path: string) => `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`

function useSupabaseAuth(client: SupabaseClient): AuthValue {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const authUser = session?.user ?? null
  const uid = authUser?.id ?? null

  useEffect(() => {
    client.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionLoaded(true)
    })
    const { data } = client.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setSessionLoaded(true)
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setPasswordRecovery(false)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [client])

  // Load the profile whenever a different user signs in (not on every token refresh).
  const needsProfile = !!authUser && profile?.id !== authUser.id
  useEffect(() => {
    if (!needsProfile || !authUser) return
    let cancelled = false
    fetchProfile(client, authUser).then((p) => !cancelled && setProfile(p))
    return () => {
      cancelled = true
    }
  }, [client, uid, needsProfile]) // eslint-disable-line react-hooks/exhaustive-deps

  const user = useMemo<User | null>(() => {
    if (!authUser || !profile || profile.id !== authUser.id) return null
    return {
      id: authUser.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: authUser.email ?? '',
      password: '',
      role: profile.role === 'Profesor' ? 'Profesor' : 'Estudiante',
      ...(profile.role === 'Profesor' ? { school: profile.school ?? '', subject: profile.subject ?? '' } : {}),
      avatarColor: profile.avatar_color,
      avatarDataUrl: profile.avatar_url ?? undefined,
      plan: profile.plan,
      createdAt: profile.created_at,
      provider: profile.provider,
    }
  }, [authUser, profile])

  const ready = sessionLoaded && (!authUser || !!user)

  const login = useCallback<AuthValue['login']>(
    async (email, password) => {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
      if (error) return fail(error)
      setProfile(await fetchProfile(client, data.user))
      return { ok: true }
    },
    [client],
  )

  const loginWithGoogle = useCallback<AuthValue['loginWithGoogle']>(async () => {
    // Redirects to Google; the session is picked up by onAuthStateChange on return.
    const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: appUrl('/home') } })
    return error ? fail(error) : { ok: true }
  }, [client])

  const register = useCallback<AuthValue['register']>(
    async ({ fullName, email, password, role, school, subject }) => {
      const [firstName, ...rest] = fullName.trim().split(/\s+/)
      const { data, error } = await client.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          // The database trigger copies these into the profile (see the classroom migration).
          data: {
            full_name: fullName.trim(),
            first_name: firstName,
            last_name: rest.join(' '),
            role,
            ...(role === 'Profesor' ? { school: school?.trim() ?? '', subject: subject ?? '' } : {}),
          },
          emailRedirectTo: appUrl('/home'),
        },
      })
      if (error) return fail(error)
      // With email confirmation on, an existing address returns a user without identities.
      if (data.user && data.user.identities?.length === 0) return { ok: false, error: t('Ya existe una cuenta con este correo.') }
      if (!data.session) return { ok: true, notice: t('Te enviamos un correo para confirmar tu cuenta. Ábrelo para empezar.') }
      setProfile(await fetchProfile(client, data.session.user))
      return { ok: true }
    },
    [client],
  )

  const requestPasswordReset = useCallback<AuthValue['requestPasswordReset']>(
    async (email) => {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl('/reset-password') })
      // Never reveal whether an account exists; only surface throttling or network problems.
      if (error && (error.status === 429 || error.message.toLowerCase().includes('fetch'))) return fail(error)
      return { ok: true }
    },
    [client],
  )

  const completePasswordReset = useCallback<AuthValue['completePasswordReset']>(
    async (next) => {
      const { error } = await client.auth.updateUser({ password: next })
      if (error) return fail(error)
      setPasswordRecovery(false)
      return { ok: true }
    },
    [client],
  )

  const logout = useCallback(() => {
    void client.auth.signOut()
  }, [client])

  const updateUser = useCallback<AuthValue['updateUser']>(
    async (patch) => {
      if (!user) return { ok: false, error: t('No hay sesión activa.') }
      const row: Partial<ProfileRow> = {}
      if (patch.firstName !== undefined) row.first_name = patch.firstName
      if (patch.lastName !== undefined) row.last_name = patch.lastName
      if (patch.role !== undefined) row.role = patch.role
      if (patch.school !== undefined) row.school = patch.school
      if (patch.subject !== undefined) row.subject = patch.subject
      if (patch.avatarColor !== undefined) row.avatar_color = patch.avatarColor
      if ('avatarDataUrl' in patch) row.avatar_url = patch.avatarDataUrl ?? null
      if (patch.plan !== undefined) row.plan = patch.plan
      if (Object.keys(row).length) {
        const { error } = await client.from('profiles').update(row).eq('id', user.id)
        if (error) return fail(error)
        // Keep the auth metadata in step so the repair in fetchProfile never undoes a role change.
        if (patch.role !== undefined)
          await client.auth.updateUser({ data: { role: patch.role, school: patch.school ?? '', subject: patch.subject ?? '' } })
        setProfile((p) => (p ? { ...p, ...row } : p))
      }
      const email = patch.email?.trim().toLowerCase()
      if (email && email !== user.email) {
        const { error } = await client.auth.updateUser({ email }, { emailRedirectTo: appUrl('/profile') })
        if (error) return fail(error)
        return { ok: true, notice: t('Te enviamos un enlace a {email} para confirmar el cambio de correo.', { email }) }
      }
      return { ok: true }
    },
    [client, user],
  )

  const changePassword = useCallback<AuthValue['changePassword']>(
    async (current, next) => {
      if (!user) return { ok: false, error: t('No hay sesión activa.') }
      // Re-authenticate to confirm the current password before changing it.
      const check = await client.auth.signInWithPassword({ email: user.email, password: current })
      if (check.error) return { ok: false, error: t('La contraseña actual no es correcta.') }
      const { error } = await client.auth.updateUser({ password: next })
      return error ? fail(error) : { ok: true }
    },
    [client, user],
  )

  const setPlan = useCallback(
    (plan: PlanId) => {
      if (!user) return
      setProfile((p) => (p ? { ...p, plan } : p))
      void client.from('profiles').update({ plan }).eq('id', user.id)
    },
    [client, user],
  )

  return useMemo<AuthValue>(
    () => ({
      ready,
      user,
      isAuthenticated: !!user,
      isPremium: !!user && user.plan !== 'free',
      passwordRecovery,
      login,
      loginWithGoogle,
      register,
      requestPasswordReset,
      completePasswordReset,
      logout,
      updateUser,
      changePassword,
      setPlan,
    }),
    [ready, user, passwordRecovery, login, loginWithGoogle, register, requestPasswordReset, completePasswordReset, logout, updateUser, changePassword, setPlan],
  )
}

/* ---------- Provider ---------- */

// Chosen once at startup, so the hooks called never change between renders.
const client = supabase
const useAuthImpl: () => AuthValue = client ? () => useSupabaseAuth(client) : useLocalAuth

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthImpl()
  // Wait for the stored session so protected routes don't bounce to /welcome on reload.
  if (!value.ready) return null
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
