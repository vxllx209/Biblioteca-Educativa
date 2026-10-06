import { CircleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { PasswordField, SubmitButton } from '../components/Form'
import { AuthCard } from '../components/Layouts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

/** Landing page for the password-reset email link: the link signs the user in, here they pick a new password. */
export default function ResetPassword() {
  const { isAuthenticated, passwordRecovery, completePasswordReset } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [f, setF] = useState({ next: '', confirm: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated && !passwordRecovery) return <Navigate to="/home" replace />
  if (!isAuthenticated)
    return (
      <AuthCard
        title="Enlace no válido"
        subtitle="El enlace para restablecer la contraseña expiró o ya fue usado."
        footer={
          <Link to="/forgot-password" className="font-semibold text-accent hover:underline">
            Solicitar un nuevo enlace
          </Link>
        }
      >
        <span />
      </AuthCard>
    )

  const errors = {
    next: f.next.length < 8 ? 'Debe tener al menos 8 caracteres.' : '',
    confirm: f.confirm !== f.next || !f.confirm ? 'Las contraseñas no coinciden.' : '',
  }
  const bind = (k: keyof typeof f) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value })),
    error: submitted ? errors[k] : '',
  })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError('')
    if (Object.values(errors).some(Boolean)) return
    setLoading(true)
    const res = await completePasswordReset(f.next)
    setLoading(false)
    if (!res.ok) return setError(res.error)
    toast('Contraseña actualizada')
    navigate('/home', { replace: true })
  }

  return (
    <AuthCard title="Crea una nueva contraseña" subtitle="Elige una contraseña que no hayas usado antes.">
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl bg-error-soft px-4 py-3 text-sm font-medium text-error">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}
        <PasswordField label="Nueva contraseña" autoComplete="new-password" hint="Mínimo 8 caracteres." {...bind('next')} />
        <PasswordField label="Confirmar contraseña" autoComplete="new-password" {...bind('confirm')} />
        <SubmitButton loading={loading}>Guardar contraseña</SubmitButton>
      </form>
    </AuthCard>
  )
}
