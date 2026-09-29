import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './Avatar'
import { NotificationPanel } from './NotificationPanel'

/** Notifications + avatar, shown at the top-right of every main page. */
export function TopActions() {
  const { user } = useAuth()
  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
      <NotificationPanel />
      {user && (
        <Link to="/profile" className="rounded-full" aria-label="Ir a mi perfil">
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
    <header className="mb-6 flex items-start gap-3 md:mb-8">
      {back && (
        <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Volver">
          <ArrowLeft className="size-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-[22px] leading-tight font-bold tracking-tight text-text sm:text-[26px] lg:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted sm:text-[15px]">{subtitle}</p>}
      </div>
      {actions ?? <TopActions />}
    </header>
  )
}

export function SectionHeader({ title, action, id }: { title: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 id={id} className="text-lg font-semibold text-text sm:text-xl">
        {title}
      </h2>
      {action}
    </div>
  )
}
