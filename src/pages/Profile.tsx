import {
  Bell,
  ChevronRight,
  CircleHelp,
  Crown,
  Download,
  FileDown,
  Globe,
  KeyRound,
  LogOut,
  Palette,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PasswordField, SubmitButton, Switch } from '../components/Form'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { ProfileCard } from '../components/ProfileCard'
import { ThemeSelector } from '../components/ThemeSelector'
import { useAudio } from '../context/AudioContext'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../context/LibraryContext'
import { usePreferences } from '../context/PreferencesContext'
import { useToast } from '../context/ToastContext'
import { PLANS } from '../data/mock'
import { cn } from '../lib/format'

type Panel = 'password' | 'notifications' | 'appearance' | 'language' | 'privacy' | 'help' | 'logout'

interface Row {
  icon: LucideIcon
  label: string
  description: string
  onClick: () => void
}

function SettingsGroup({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section aria-labelledby={`group-${title}`}>
      <h2 id={`group-${title}`} className="mb-3 px-1 text-xs font-semibold tracking-wide text-muted uppercase">
        {title}
      </h2>
      <ul className="card divide-y divide-line overflow-hidden">
        {rows.map(({ icon: Icon, label, description, onClick }) => (
          <li key={label}>
            <button onClick={onClick} className="group flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-bg2 sm:px-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft text-accent">
                <Icon className="size-5" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-text">{label}</span>
                <span className="block truncate text-[13px] text-muted">{description}</span>
              </span>
              <ChevronRight className="size-5 text-disabled transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const { changePassword } = useAuth()
  const toast = useToast()
  const [f, setF] = useState({ current: '', next: '', confirm: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const errors = {
    current: !f.current ? 'Ingresa tu contraseña actual.' : '',
    next: f.next.length < 8 ? 'Debe tener al menos 8 caracteres.' : f.next === f.current ? 'Debe ser distinta de la actual.' : '',
    confirm: f.confirm !== f.next || !f.confirm ? 'Las contraseñas no coinciden.' : '',
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError('')
    if (Object.values(errors).some(Boolean)) return
    setLoading(true)
    const res = await changePassword(f.current, f.next)
    setLoading(false)
    if (!res.ok) return setError(res.error)
    toast('Contraseña actualizada')
    onDone()
  }
  const bind = (k: keyof typeof f) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value })),
    error: submitted ? errors[k] || (k === 'current' ? error : '') : '',
  })
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <PasswordField label="Contraseña actual" autoComplete="current-password" {...bind('current')} />
      <PasswordField label="Nueva contraseña" autoComplete="new-password" hint="Mínimo 8 caracteres." {...bind('next')} />
      <PasswordField label="Confirmar nueva contraseña" autoComplete="new-password" {...bind('confirm')} />
      <SubmitButton loading={loading}>Actualizar contraseña</SubmitButton>
    </form>
  )
}

const FAQ = [
  { q: '¿Cómo descargo un libro?', a: 'Abre el detalle del libro y toca “Descargar”. Lo encontrarás en Mis descargas, disponible sin conexión.' },
  { q: '¿Se guarda mi progreso de lectura?', a: 'Sí. Guardamos automáticamente la página, el capítulo y el porcentaje leído cada vez que avanzas.' },
  { q: '¿Qué incluye Premium?', a: 'Acceso a todos los libros, audiolibros completos, descargas ilimitadas y contenido exclusivo.' },
  { q: '¿Puedo cancelar mi suscripción?', a: 'Puedes cambiar a plan Gratis cuando quieras desde la pantalla de Premium, sin costo adicional.' },
]

export default function Profile() {
  const { user, logout, isPremium } = useAuth()
  const { prefs, setPref } = usePreferences()
  const library = useLibrary()
  const audio = useAudio()
  const toast = useToast()
  const navigate = useNavigate()
  const [panel, setPanel] = useState<Panel | null>(null)
  if (!user) return null
  const close = () => setPanel(null)
  const plan = PLANS.find((p) => p.id === user.plan)

  const exportData = () => {
    const data = {
      user: { ...user, password: undefined },
      favorites: library.favorites,
      downloads: library.downloads,
      readingProgress: library.progress,
      tasks: library.tasks,
      preferences: prefs,
      exportedAt: new Date().toISOString(),
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'biblioteca-educativa-mis-datos.json'
    a.click()
    URL.revokeObjectURL(url)
    toast('Tus datos se descargaron')
  }

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: 'Cuenta',
      rows: [
        { icon: UserRound, label: 'Mi información', description: 'Nombre, correo y foto de perfil', onClick: () => navigate('/profile/edit') },
        { icon: KeyRound, label: 'Cambiar contraseña', description: 'Actualiza tu contraseña de acceso', onClick: () => setPanel('password') },
        { icon: Crown, label: 'Suscripción', description: `Plan ${plan?.name ?? 'Gratis'}${isPremium ? ' · activo' : ''}`, onClick: () => navigate('/premium') },
        { icon: Download, label: 'Mis descargas', description: `${library.downloads.length} libros disponibles sin conexión`, onClick: () => navigate('/downloads') },
      ],
    },
    {
      title: 'Preferencias',
      rows: [
        { icon: Bell, label: 'Notificaciones', description: 'Tareas, recomendaciones y descargas', onClick: () => setPanel('notifications') },
        {
          icon: Palette,
          label: 'Apariencia',
          description: prefs.theme === 'light' ? 'Modo claro' : prefs.theme === 'dark' ? 'Modo oscuro' : 'Automático',
          onClick: () => setPanel('appearance'),
        },
        { icon: Globe, label: 'Idioma', description: prefs.language === 'es' ? 'Español' : 'English', onClick: () => setPanel('language') },
      ],
    },
    {
      title: 'Soporte',
      rows: [
        { icon: ShieldCheck, label: 'Privacidad', description: 'Controla tus datos y tu actividad', onClick: () => setPanel('privacy') },
        { icon: CircleHelp, label: 'Ayuda', description: 'Preguntas frecuentes y contacto', onClick: () => setPanel('help') },
      ],
    },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader title="Perfil" />
      <div className="mx-auto max-w-3xl space-y-8">
        <ProfileCard />
        {groups.map((g) => (
          <SettingsGroup key={g.title} {...g} />
        ))}
        <button
          onClick={() => setPanel('logout')}
          className="card flex min-h-16 w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:border-error/40 hover:bg-error-soft sm:px-5"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-error-soft text-error">
            <LogOut className="size-5" aria-hidden />
          </span>
          <span className="text-[15px] font-medium text-error">Cerrar sesión</span>
        </button>
        <p className="text-center text-xs text-disabled">Biblioteca Educativa · versión 1.0.0</p>
      </div>

      <Modal open={panel === 'password'} onClose={close} title="Cambiar contraseña" description="Por seguridad, ingresa tu contraseña actual." size="sm">
        <ChangePasswordForm onDone={close} />
      </Modal>

      <Modal open={panel === 'notifications'} onClose={close} title="Notificaciones" size="sm">
        <div className="divide-y divide-line">
          <Switch label="Tareas próximas a vencer" description="Recordatorios antes de la fecha límite" checked={prefs.notifyTasks} onChange={(v) => setPref('notifyTasks', v)} />
          <Switch label="Nuevas recomendaciones" description="Libros que podrían interesarte" checked={prefs.notifyRecommendations} onChange={(v) => setPref('notifyRecommendations', v)} />
          <Switch label="Descargas completadas" description="Aviso cuando un libro esté disponible sin conexión" checked={prefs.notifyDownloads} onChange={(v) => setPref('notifyDownloads', v)} />
        </div>
      </Modal>

      <Modal open={panel === 'appearance'} onClose={close} title="Apariencia" description="Elige cómo se ve la aplicación." size="sm">
        <ThemeSelector />
        <p className="mt-4 text-xs text-muted">“Automático” sigue la configuración de tu dispositivo.</p>
      </Modal>

      <Modal open={panel === 'language'} onClose={close} title="Idioma" size="sm">
        <div role="radiogroup" aria-label="Idioma" className="space-y-2">
          {(
            [
              { v: 'es', label: 'Español' },
              { v: 'en', label: 'English' },
            ] as const
          ).map(({ v, label }) => (
            <button
              key={v}
              role="radio"
              aria-checked={prefs.language === v}
              onClick={() => {
                setPref('language', v)
                toast(v === 'es' ? 'Idioma actualizado' : 'Language preference saved')
              }}
              className={cn(
                'flex h-12 w-full items-center justify-between rounded-xl border px-4 text-[15px] font-medium transition-colors',
                prefs.language === v ? 'border-primary bg-softer text-accent dark:border-secondary' : 'border-line text-text hover:border-line-active',
              )}
            >
              {label}
              <span className={cn('size-4 rounded-full border-2', prefs.language === v ? 'border-[5px] border-primary dark:border-secondary' : 'border-line-active')} aria-hidden />
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">Los libros se muestran en su idioma original. La traducción completa de la interfaz llegará en una próxima versión.</p>
      </Modal>

      <Modal open={panel === 'privacy'} onClose={close} title="Privacidad" size="sm">
        <div className="divide-y divide-line">
          <Switch label="Recomendaciones personalizadas" description="Usar tu historial de lectura para sugerirte libros" checked={prefs.personalizedRecommendations} onChange={(v) => setPref('personalizedRecommendations', v)} />
          <Switch label="Compartir actividad" description="Mostrar a tus compañeros lo que estás leyendo" checked={prefs.shareActivity} onChange={(v) => setPref('shareActivity', v)} />
        </div>
        <button onClick={exportData} className="btn-secondary mt-6 w-full">
          <FileDown className="size-5" aria-hidden /> Descargar mis datos
        </button>
      </Modal>

      <Modal open={panel === 'help'} onClose={close} title="Ayuda" description="Preguntas frecuentes">
        <div className="space-y-2">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl border border-line px-4 open:bg-softer">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-medium text-text [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronRight className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-90" aria-hidden />
              </summary>
              <p className="pb-4 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <a href="mailto:soporte@bibliotecaeducativa.app" className="btn-primary mt-6 w-full">
          Contactar a soporte
        </a>
      </Modal>

      <Modal
        open={panel === 'logout'}
        onClose={close}
        title="¿Cerrar sesión?"
        description="Tu progreso y tus favoritos quedarán guardados para la próxima vez."
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={close}>
              Cancelar
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                audio.close()
                logout()
                toast('Sesión cerrada', 'info')
              }}
            >
              Cerrar sesión
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">Podrás volver a ingresar con tu correo o con Google.</p>
      </Modal>
    </div>
  )
}
