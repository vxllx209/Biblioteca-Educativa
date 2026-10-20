import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAudio } from '../context/AudioContext'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/format'
import { BottomNavigation } from './BottomNavigation'
import { BrandPanel, FirstLineEpigraph } from './BrandPanel'
import { Logo } from './Logo'
import { MiniPlayer } from './MiniPlayer'
import { Sidebar } from './Sidebar'
import { t } from '../i18n'

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export function RequireAuth() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/welcome" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Teacher-only screens; students land on their own tasks instead. */
export function RequireTeacher() {
  const { user } = useAuth()
  if (user?.role !== 'Profesor') return <Navigate to="/tasks" replace />
  return <Outlet />
}

export function PublicOnly() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/home" replace />
  return <Outlet />
}

/** Shell for authenticated screens: sidebar (desktop/tablet), bottom nav (mobile), persistent mini-player. */
export function AppLayout() {
  const { book } = useAudio()
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-[80] rounded-lg bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t('Saltar al contenido')}
      </a>
      <Sidebar />
      <main
        id="main"
        className={cn(
          'md:pl-20 lg:pl-64',
          book ? 'pb-[calc(env(safe-area-inset-bottom)+180px)] md:pb-32' : 'pb-[calc(env(safe-area-inset-bottom)+104px)] md:pb-16',
        )}
      >
        <div className="mx-auto w-full max-w-[1320px] px-4 pt-5 sm:px-6 md:pt-8 lg:px-10 lg:pt-10">
          <Outlet />
        </div>
      </main>
      <MiniPlayer />
      <BottomNavigation />
    </div>
  )
}

/** Split layout for the authentication screens: brand panel (desktop) + form card. */
export function AuthCard({ title, subtitle, brandTitle, children, footer }: { title: string; subtitle: string; brandTitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-4 lg:p-4">
      <div className="sticky top-4 hidden h-[calc(100dvh-2rem)] self-start lg:block">
        <BrandPanel title={brandTitle} />
      </div>
      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link to="/welcome" className="rounded-xl lg:hidden" aria-label={t('Volver a la bienvenida')}>
          <Logo />
        </Link>
        <FirstLineEpigraph className="mt-5 mb-8" />
        <div className="w-full max-w-[440px] animate-rise">
          <div className="card rounded-feature p-6 shadow-pop sm:p-10 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
            <span className="gold-rule rule-draw" aria-hidden />
            <h1 className="mt-4 font-display text-[28px] leading-tight text-text sm:text-[34px]">{title}</h1>
            <p className="mt-2 text-[15px] text-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
