import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './Avatar'
import { NotificationPanel } from './NotificationPanel'
import { t } from '../i18n'

/** Notifications + avatar, shown at the top-right of every main page. */
export function TopActions() {
  const { user } = useAuth()
  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <NotificationPanel />
      {user && (
        <Link to="/profile" className="rounded-full" aria-label={t('Ir a mi perfil')}>
          <Avatar user={user} />
        </Link>
      )}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  back?: boolean
  actions?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <header className="mb-7 flex items-start gap-3 md:mb-10">
      {back && (
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label={t('Volver')}>
          <ArrowLeft className="size-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[26px] leading-[1.1] text-text sm:text-[32px] lg:text-[40px]">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted sm:text-[15px]">{subtitle}</p>}
      </div>
      {actions ?? <TopActions />}
    </header>
  )
}

export function SectionHeader({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 id={id} className="flex items-center gap-3 font-display text-[21px] leading-tight text-text sm:text-2xl">
        <span className="h-6 w-1 shrink-0 rounded-full bg-gradient-to-b from-gold to-secondary" aria-hidden />
        {title}
      </h2>
      {action}
    </div>
  )
}
