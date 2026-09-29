import { ChevronRight, Crown } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/format'
import { Avatar } from './Avatar'
import { Logo } from './Logo'
import { NAV_ITEMS } from './nav'

/** Desktop (≥1200px): full 256px sidebar. Tablet (768–1199px): 80px icon rail. Hidden on mobile. */
export function Sidebar() {
  const { user, isPremium } = useAuth()
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r border-line bg-surface md:flex lg:w-64"
      aria-label="Navegación principal"
    >
      <Link to="/home" className="flex h-20 items-center justify-center px-5 lg:justify-start" aria-label="Biblioteca Educativa, inicio">
        <Logo compact className="lg:hidden" />
        <Logo className="hidden lg:flex" />
      </Link>

      <nav className="mt-2 flex-1 overflow-y-auto px-3 lg:px-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                title={label}
                className={({ isActive }) =>
                  cn(
                    'group relative flex h-12 items-center justify-center gap-3 rounded-xl text-[15px] font-medium transition-colors duration-200 lg:justify-start lg:px-4',
                    isActive ? 'bg-soft text-accent' : 'text-muted hover:bg-bg2 hover:text-text',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity duration-200 lg:-left-4 dark:bg-accent',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                      aria-hidden
                    />
                    <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.1 : 1.8} aria-hidden />
                    <span className="sr-only lg:not-sr-only">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {!isPremium && (
          <div className="mt-8 hidden rounded-[14px] bg-softer p-4 lg:block">
            <span className="grid size-9 place-items-center rounded-lg bg-soft text-accent">
              <Crown className="size-[18px]" aria-hidden />
            </span>
            <p className="mt-3 text-sm leading-snug font-semibold text-text">Desbloquea todo el potencial</p>
            <p className="mt-1 text-xs text-muted">Audiolibros, descargas ilimitadas y contenido exclusivo.</p>
            <Link to="/premium" className="btn-primary mt-4 min-h-10 w-full text-sm">
              Ver Premium
            </Link>
          </div>
        )}
        {!isPremium && (
          <Link
            to="/premium"
            title="Ver Premium"
            className="mt-4 flex h-12 items-center justify-center rounded-xl bg-softer text-accent transition-colors hover:bg-soft lg:hidden"
            aria-label="Ver Premium"
          >
            <Crown className="size-5" aria-hidden />
          </Link>
        )}
      </nav>

      {user && (
        <Link
          to="/profile"
          className="m-3 flex items-center justify-center gap-3 rounded-xl p-2 transition-colors hover:bg-bg2 lg:m-4 lg:justify-start"
          aria-label={`Perfil de ${user.firstName}`}
        >
          <Avatar user={user} size="sm" />
          <span className="hidden min-w-0 flex-1 lg:block">
            <span className="block truncate text-sm font-semibold text-text">
              {user.firstName} {user.lastName}
            </span>
            <span className="block truncate text-xs text-muted">{isPremium ? 'Premium' : user.role}</span>
          </span>
          <ChevronRight className="hidden size-4 text-muted lg:block" aria-hidden />
        </Link>
      )}
    </aside>
  )
}
