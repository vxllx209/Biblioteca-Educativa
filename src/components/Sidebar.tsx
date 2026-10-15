import { ChevronRight, Crown, Sparkles } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/format'
import { Avatar } from './Avatar'
import { Logo } from './Logo'
import { navItems } from './nav'
import { t } from '../i18n'

/** Desktop (≥1200px): full 256px sidebar. Tablet (768–1199px): 80px icon rail. Hidden on mobile. */
export function Sidebar() {
  const { user, isPremium } = useAuth()
  return (
    <aside
      className="forest-panel fixed inset-y-0 left-0 z-30 hidden w-20 flex-col shadow-[1px_0_0_rgba(255,255,255,0.04),12px_0_40px_-20px_rgba(18,36,29,0.6)] md:flex lg:w-64"
      aria-label={t('Navegación principal')}
    >
      <Link to="/home" className="flex h-24 items-center justify-center px-5 lg:justify-start lg:px-6" aria-label={t('Biblioteca Educativa, inicio')}>
        <Logo compact onDark className="lg:hidden" />
        <Logo onDark className="hidden lg:flex" />
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 no-scrollbar lg:px-4">
        <p className="mb-2 hidden px-4 text-[10px] font-semibold tracking-[0.2em] text-sage/80 uppercase lg:block">{t('Menú')}</p>
        <ul className="space-y-1">
          {navItems(user?.role).map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                title={t(label)}
                className={({ isActive }) =>
                  cn(
                    'group relative flex h-12 items-center justify-center gap-3 rounded-xl text-[15px] font-medium transition-all duration-200 lg:justify-start lg:px-4',
                    isActive
                      ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'text-mint/65 hover:bg-white/[0.05] hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold shadow-[0_0_14px_rgba(217,163,91,0.8)] transition-all duration-300 lg:-left-4',
                        isActive ? 'opacity-100' : 'h-2 opacity-0',
                      )}
                      aria-hidden
                    />
                    <Icon
                      className={cn('size-5 shrink-0 transition-transform duration-200 group-hover:scale-110', isActive && 'text-gold')}
                      strokeWidth={isActive ? 2.1 : 1.8}
                      aria-hidden
                    />
                    <span className="sr-only lg:not-sr-only">{t(label)}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {!isPremium && (
          <div className="relative mt-8 hidden overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.06] p-4 lg:block">
            <span
              className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-gold/25 blur-2xl"
              aria-hidden
            />
            <span className="relative grid size-9 place-items-center rounded-lg bg-gradient-to-br from-gold to-[#a8732f] text-[#1f1607] shadow-[0_6px_16px_-6px_rgba(217,163,91,0.9)]">
              <Crown className="size-[18px]" aria-hidden />
            </span>
            <p className="relative mt-3 font-display text-[15px] leading-snug text-white">{t('Desbloquea todo el potencial')}</p>
            <p className="relative mt-1 text-xs leading-relaxed text-mint/65">{t('Audiolibros, descargas ilimitadas y contenido exclusivo.')}</p>
            <Link to="/premium" className="btn-gold relative mt-4 min-h-10 w-full text-sm">
              <Sparkles className="size-4" aria-hidden />
              {t('Ver Premium')}
            </Link>
          </div>
        )}
        {!isPremium && (
          <Link
            to="/premium"
            title={t('Ver Premium')}
            className="mt-4 flex h-12 items-center justify-center rounded-xl bg-gold/15 text-gold transition-colors hover:bg-gold/25 lg:hidden"
            aria-label={t('Ver Premium')}
          >
            <Crown className="size-5" aria-hidden />
          </Link>
        )}
      </nav>

      {user && (
        <Link
          to="/profile"
          className="m-3 flex items-center justify-center gap-3 rounded-2xl border border-transparent p-2 transition-colors hover:border-white/10 hover:bg-white/[0.06] lg:m-4 lg:justify-start"
          aria-label={t('Perfil de {name}', { name: user.firstName })}
        >
          <Avatar user={user} size="sm" className="ring-2 ring-white/15" />
          <span className="hidden min-w-0 flex-1 lg:block">
            <span className="block truncate text-sm font-semibold text-white">
              {user.firstName} {user.lastName}
            </span>
            <span className={cn('block truncate text-xs', isPremium ? 'text-gold' : 'text-mint/60')}>
              {isPremium ? 'Premium' : t(user.role)}
            </span>
          </span>
          <ChevronRight className="hidden size-4 text-mint/50 lg:block" aria-hidden />
        </Link>
      )}
    </aside>
  )
}
