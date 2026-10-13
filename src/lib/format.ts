import { CURRENCY } from '../data/mock'
import { locale, plural, t } from '../i18n'

export const formatPrice = (value: number) =>
  new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString(locale(), opts)

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
  if (d < -1) return t('Venció hace {n} días', { n: -d })
  if (d === -1) return t('Venció ayer')
  if (d === 0) return t('Vence hoy')
  if (d === 1) return t('Vence mañana')
  return t('Vence en {n} días', { n: d })
}

export const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60_000)
  if (min < 1) return t('Ahora')
  if (min < 60) return t('Hace {n} min', { n: min })
  const h = Math.round(min / 60)
  if (h < 24) return t('Hace {n} h', { n: h })
  const d = Math.round(h / 24)
  return d === 1 ? t('Ayer') : plural(d, 'Hace {n} día', 'Hace {n} días')
}

export const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const initials = (first: string, last?: string) =>
  `${first.charAt(0)}${last?.charAt(0) ?? ''}`.toUpperCase()

export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')
