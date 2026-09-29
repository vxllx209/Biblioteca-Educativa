import { NavLink } from 'react-router-dom'
import { cn } from '../lib/format'
import { MOBILE_NAV } from './nav'

/** Mobile (<768px) fixed tab bar. */
export function BottomNavigation() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto grid h-[68px] max-w-lg grid-cols-5">
        {MOBILE_NAV.map(({ to, label, shortLabel, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-200',
                  isActive ? 'text-accent' : 'text-muted hover:text-text',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid h-7 w-12 place-items-center rounded-full transition-colors duration-200',
                      isActive && 'bg-soft',
                    )}
                  >
                    <Icon className="size-[21px]" strokeWidth={isActive ? 2.1 : 1.8} aria-hidden />
                  </span>
                  {shortLabel ?? label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
