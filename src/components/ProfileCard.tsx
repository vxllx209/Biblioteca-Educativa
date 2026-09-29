import { Crown, PenLine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { Avatar } from './Avatar'

export function ProfileCard() {
  const { user, isPremium } = useAuth()
  const { favorites, progress, tasks, practice } = useLibrary()
  if (!user) return null
  const stats = [
    { label: 'Leyendo', value: Object.keys(progress).length },
    { label: 'Favoritos', value: favorites.length },
    { label: 'Prácticas', value: Object.keys(practice).length },
    { label: 'Tareas hechas', value: tasks.filter((t) => t.status === 'completada').length },
  ]
  return (
    <section className="card overflow-hidden rounded-[18px]" aria-label="Resumen del perfil">
      <div className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
        <Avatar user={user} size="lg" className="ring-4 ring-soft" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-text sm:text-[28px]">{user.firstName}</h1>
          <p className="mt-0.5 flex items-center justify-center gap-2 text-[15px] text-muted sm:justify-start">
            {user.role}
            {isPremium && (
              <span className="badge bg-soft text-accent">
                <Crown className="size-3.5" aria-hidden /> Premium
              </span>
            )}
          </p>
          <p className="mt-1 truncate text-sm text-disabled">{user.email}</p>
        </div>
        <Link to="/profile/edit" className="btn-secondary w-full sm:w-auto">
          <PenLine className="size-4" aria-hidden />
          Editar perfil
        </Link>
      </div>
      <dl className="grid grid-cols-2 border-t border-line sm:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-4 py-4 text-center ${i % 2 ? 'border-l border-line' : ''} ${i >= 2 ? 'border-t border-line sm:border-t-0' : ''} sm:border-l sm:first:border-l-0`}>
            <dt className="text-xs text-muted">{s.label}</dt>
            <dd className="mt-0.5 text-xl font-bold text-accent">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
