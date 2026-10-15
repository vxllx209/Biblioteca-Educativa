import { Crown, PenLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { Avatar } from './Avatar'
import { t } from '../i18n'

export function ProfileCard() {
  const { user, isPremium } = useAuth()
  const { favorites, progress, tasks, practice } = useLibrary()
  if (!user) return null
  const stats = [
    { label: t('Leyendo'), value: Object.keys(progress).length },
    { label: t('Favoritos'), value: favorites.length },
    { label: t('Prácticas'), value: Object.keys(practice).length },
    { label: t('Tareas hechas'), value: tasks.filter((task) => task.status === 'completada').length },
  ]
  return (
    <section className="card overflow-hidden rounded-feature" aria-label={t('Resumen del perfil')}>
      <div className="forest-panel h-24 sm:h-28" aria-hidden />
      <div className="flex flex-col items-center gap-5 px-6 pb-6 text-center sm:flex-row sm:items-start sm:px-8 sm:pb-8 sm:text-left">
        <Avatar user={user} size="lg" className="relative z-10 -mt-12 shadow-lift ring-4 ring-surface" />
        <div className="min-w-0 flex-1 sm:pt-4">
          <h1 className="font-display text-2xl text-text sm:text-[30px]">{user.firstName}</h1>
          <p className="mt-0.5 flex items-center justify-center gap-2 text-[15px] text-muted sm:justify-start">
            {t(user.role)}
            {isPremium && (
              <span className="badge bg-soft text-accent">
                <Crown className="size-3.5" aria-hidden /> Premium
              </span>
            )}
          </p>
          <p className="mt-1 truncate text-sm text-disabled">{user.email}</p>
        </div>
        <Link to="/profile/edit" className="btn-secondary w-full sm:mt-4 sm:w-auto">
          <PenLine className="size-4" aria-hidden />
          {t('Editar perfil')}
        </Link>
      </div>
      <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-4 py-4 text-center ${i % 2 ? 'border-l border-line' : ''} ${i >= 2 ? 'border-t border-line sm:border-t-0' : ''} sm:border-l sm:first:border-l-0`}>
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className="mt-0.5 font-display text-2xl text-accent">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
