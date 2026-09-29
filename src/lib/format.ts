import { CURRENCY } from '../data/mock'

export const formatPrice = (value: number) =>
  new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('es-ES', opts)

export const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

export const daysUntil = (iso: string) => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(iso)
  end.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

export const dueLabel = (iso: string) => {
  const d = daysUntil(iso)
  if (d < -1) return `Venció hace ${-d} días`
  if (d === -1) return 'Venció ayer'
  if (d === 0) return 'Vence hoy'
  if (d === 1) return 'Vence mañana'
  return `Vence en ${d} días`
}

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'Ahora'
  if (min < 60) return `Hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `Hace ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'Ayer' : `Hace ${d} días`
}

export const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const initials = (first: string, last?: string) =>
  `${first.charAt(0)}${last?.charAt(0) ?? ''}`.toUpperCase()

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')
