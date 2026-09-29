import { ClipboardList, Compass, Download, Heart, House, UserRound, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  shortLabel?: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/home', label: 'Inicio', icon: House },
  { to: '/explore', label: 'Explorar', icon: Compass },
  { to: '/tasks', label: 'Mis tareas', shortLabel: 'Tareas', icon: ClipboardList },
  { to: '/favorites', label: 'Favoritos', icon: Heart },
  { to: '/downloads', label: 'Descargas', icon: Download },
  { to: '/profile', label: 'Perfil', icon: UserRound },
]

export const MOBILE_NAV = NAV_ITEMS.filter((i) => i.to !== '/downloads')
