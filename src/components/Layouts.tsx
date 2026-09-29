import { useEffect, type ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAudio } from '../context/AudioContext'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/format'
import { BottomNavigation } from './BottomNavigation'
import { Logo } from './Logo'
import { MiniPlayer } from './MiniPlayer'
import { Sidebar } from './Sidebar'

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
        Saltar al contenido
      </a>
      <Sidebar />
      <main
        id="main"
        className={cn(
          'md:pl-20 lg:pl-64',
          book ? 'pb-[calc(68px+env(safe-area-inset-bottom)+96px)] md:pb-28' : 'pb-[calc(68px+env(safe-area-inset-bottom)+24px)] md:pb-12',
        )}
      >
        <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 sm:px-6 md:pt-8 lg:px-8 lg:pt-10">
          <Outlet />
        </div>
      </main>
      <MiniPlayer />
      <BottomNavigation />
    </div>
  )
}

/** Centered card layout for the authentication screens. */
export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-10">
      <Link to="/welcome" className="mb-8 rounded-xl" aria-label="Volver a la bienvenida">
        <Logo />
      </Link>
      <div className="w-full max-w-[460px] animate-rise rounded-[18px] border border-line bg-surface p-6 shadow-card sm:p-10">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-[28px]">{title}</h1>
        <p className="mt-2 text-[15px] text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
    </div>
  )
}
