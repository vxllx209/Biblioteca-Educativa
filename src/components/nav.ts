import { ClipboardList, Compass, Download, Heart, House, Presentation, UserRound, type LucideIcon } from 'lucide-react'
import type { Role } from '../types'

export interface NavItem {
  to: string
  label: string
  shortLabel?: string
  icon: LucideIcon
}

const TASKS_ITEM: NavItem = { to: '/tasks', label: 'Mis tareas', shortLabel: 'Tareas', icon: ClipboardList }
const COURSES_ITEM: NavItem = { to: '/aula', label: 'Mis cursos', shortLabel: 'Cursos', icon: Presentation }

/** Teachers get their courses where students see their tasks. */
export const navItems = (role?: Role): NavItem[] => [
  { to: '/home', label: 'Inicio', icon: House },
  { to: '/explore', label: 'Explorar', icon: Compass },
  role === 'Profesor' ? COURSES_ITEM : TASKS_ITEM,
  { to: '/favorites', label: 'Favoritos', icon: Heart },
  { to: '/downloads', label: 'Descargas', icon: Download },
  { to: '/profile', label: 'Perfil', icon: UserRound },
]

export const mobileNav = (role?: Role) => navItems(role).filter((i) => i.to !== '/downloads')
