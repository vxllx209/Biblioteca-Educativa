import { Camera, CircleAlert, Trash2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { isEmail, SubmitButton, TextField } from '../components/Form'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const AVATAR_COLORS = ['#4F806D', '#285B4A', '#9C6450', '#3F5560', '#6B7448', '#C18A45']

/** Resize an uploaded image to a small square data URL so it fits in localStorage. */
function toAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const size = 192
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const ctx = canvas.getContext('2d')!
      const s = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      URL.revokeObjectURL(img.src)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function ProfileEdit() {
  const { user, updateUser, changePassword } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    currentPassword: '',
    password: '',
  })
  const [avatar, setAvatar] = useState({ dataUrl: user?.avatarDataUrl, color: user?.avatarColor ?? AVATAR_COLORS[0] })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  if (!user) return null

  const errors = {
    firstName: !form.firstName.trim() ? 'Ingresa tu nombre.' : '',
    lastName: '',
    email: !isEmail(form.email) ? 'Ingresa un correo válido.' : '',
    password: form.password && form.password.length < 8 ? 'Debe tener al menos 8 caracteres.' : '',
    currentPassword: form.password && !form.currentPassword ? 'Ingresa tu contraseña actual para cambiarla.' : '',
  }
  const bind = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [k]: e.target.value })),
    error: submitted ? errors[k] : '',
  })

  const pickFile = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast('Selecciona una imagen válida', 'error')
    try {
      setAvatar((a) => ({ ...a, dataUrl: undefined }))
      const dataUrl = await toAvatarDataUrl(file)
      setAvatar((a) => ({ ...a, dataUrl }))
    } catch {
      toast('No pudimos procesar la imagen', 'error')
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError('')
    if (Object.values(errors).some(Boolean)) return
    setLoading(true)
    if (form.password) {
      const pw = await changePassword(form.currentPassword, form.password)
      if (!pw.ok) {
        setLoading(false)
        return setError(pw.error)
      }
    }
    const res = await updateUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email,
      avatarDataUrl: avatar.dataUrl,
      avatarColor: avatar.color,
    })
    setLoading(false)
    if (!res.ok) return setError(res.error)
    toast('Cambios guardados correctamente')
    navigate('/profile')
  }

  const preview = { ...user, firstName: form.firstName || user.firstName, lastName: form.lastName, avatarDataUrl: avatar.dataUrl, avatarColor: avatar.color }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Editar perfil" subtitle="Actualiza tu información personal." back />
      <form onSubmit={submit} noValidate className="mx-auto max-w-2xl space-y-6">
        <section className="card flex flex-col items-center gap-5 p-6 sm:flex-row sm:p-8">
          <div className="relative">
            <Avatar user={preview} size="lg" className="ring-4 ring-soft" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -right-1 -bottom-1 grid size-10 place-items-center rounded-full border-2 border-surface bg-primary text-white transition-colors hover:bg-primary-hover"
              aria-label="Cambiar foto de perfil"
            >
              <Camera className="size-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => pickFile(e.target.files?.[0])} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-text">Foto de perfil</p>
            <p className="mt-0.5 text-[13px] text-muted">Sube una imagen o elige un color para tus iniciales.</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatar({ dataUrl: undefined, color: c })}
                  className="grid size-11 place-items-center rounded-full"
                  aria-label={`Usar color ${c}`}
                  aria-pressed={!avatar.dataUrl && avatar.color === c}
                >
                  <span
                    className={`size-7 rounded-full ring-offset-2 ring-offset-surface transition-shadow ${!avatar.dataUrl && avatar.color === c ? 'ring-2 ring-primary dark:ring-secondary' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                </button>
              ))}
              {avatar.dataUrl && (
                <button type="button" onClick={() => setAvatar((a) => ({ ...a, dataUrl: undefined }))} className="btn-ghost min-h-10 px-3 text-sm">
                  <Trash2 className="size-4" aria-hidden /> Quitar foto
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="card space-y-5 p-6 sm:p-8">
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-xl bg-error-soft px-4 py-3 text-sm font-medium text-error">
              <CircleAlert className="size-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Nombre" autoComplete="given-name" {...bind('firstName')} />
            <TextField label="Apellido" autoComplete="family-name" {...bind('lastName')} />
          </div>
          <TextField label="Correo electrónico" type="email" autoComplete="email" {...bind('email')} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Contraseña actual" type="password" autoComplete="current-password" placeholder="••••••••" {...bind('currentPassword')} />
            <TextField label="Nueva contraseña" type="password" autoComplete="new-password" placeholder="Dejar vacío para no cambiar" hint="Mínimo 8 caracteres." {...bind('password')} />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary h-12" onClick={() => navigate('/profile')}>
            Cancelar
          </button>
          <SubmitButton loading={loading} className="sm:w-auto sm:px-8">
            Guardar cambios
          </SubmitButton>
        </div>
      </form>
    </div>
  )
}
