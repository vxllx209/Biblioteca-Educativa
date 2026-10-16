import { ClipboardList, Compass, Download, GraduationCap, Heart, House, Presentation, UserRound, type LucideIcon } from 'lucide-react'
import type { Role } from '../types'

export interface NavItem {
  to: string
  label: string
  shortLabel?: string
  icon: LucideIcon
}

const TASKS_ITEM: NavItem = { to: '/tasks', label: 'Mis tareas', shortLabel: 'Tareas', icon: ClipboardList }
const COURSES_ITEM: NavItem = { to: '/aula', label: 'Mis cursos', shortLabel: 'Cursos', icon: Presentation }
const PAES_ITEM: NavItem = { to: '/paes', label: 'Preparación PAES', shortLabel: 'PAES', icon: GraduationCap }

/** Teachers get their courses where students see their tasks and PAES preparation. */
export const navItems = (role?: Role): NavItem[] => [
  { to: '/home', label: 'Inicio', icon: House },
  { to: '/explore', label: 'Explorar', icon: Compass },
  ...(role === 'Profesor' ? [COURSES_ITEM] : [PAES_ITEM, TASKS_ITEM]),
  { to: '/favorites', label: 'Favoritos', icon: Heart },
  { to: '/downloads', label: 'Descargas', icon: Download },
  { to: '/profile', label: 'Perfil', icon: UserRound },
]

/** The tab bar fits five items: downloads go first, then favorites (both stay in the profile and sidebar). */
export const mobileNav = (role?: Role) => {
  const items = navItems(role).filter((i) => i.to !== '/downloads')
  return items.length > 5 ? items.filter((i) => i.to !== '/favorites') : items
}
