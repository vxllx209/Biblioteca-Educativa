import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/format'
import { mobileNav } from './nav'
import { t } from '../i18n'

/** Mobile (<768px) floating tab bar. */
export function BottomNavigation() {
  const { user } = useAuth()
  return (
    <nav
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-30 md:hidden"
      aria-label={t('Navegación principal')}
    >
      <ul className="glass mx-auto grid h-16 max-w-lg grid-cols-5 rounded-[22px] px-1.5 shadow-pop">
        {mobileNav(user?.role).map(({ to, label, shortLabel, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold transition-colors duration-200',
                  isActive ? 'text-accent' : 'text-muted hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid h-8 w-12 place-items-center rounded-full transition-all duration-300 ease-out-soft',
                      isActive ? 'bg-primary text-white shadow-glow' : 'scale-90',
                    )}
                  >
                    <Icon className="size-[20px]" strokeWidth={isActive ? 2.1 : 1.8} aria-hidden />
                  </span>
                  {t(shortLabel ?? label)}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
