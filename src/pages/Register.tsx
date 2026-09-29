import { CircleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Checkbox, Divider, GoogleButton, isEmail, PasswordField, SubmitButton, TextField } from '../components/Form'
import { AuthCard } from '../components/Layouts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { cn } from '../lib/format'

type Field = 'name' | 'email' | 'password' | 'confirm' | 'terms'

function passwordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++
  return score
}
const STRENGTH = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente']

export default function Register() {
  const { register, loginWithGoogle } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [terms, setTerms] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState<'form' | 'google' | null>(null)
  const [error, setError] = useState('')

  const errors: Record<Field, string> = {
    name: form.name.trim().length < 3 ? 'Ingresa tu nombre completo.' : '',
    email: !form.email.trim() ? 'Ingresa tu correo electrónico.' : !isEmail(form.email) ? 'Ingresa un correo válido.' : '',
    password: form.password.length < 8 ? 'La contraseña debe tener al menos 8 caracteres.' : '',
    confirm: !form.confirm ? 'Confirma tu contraseña.' : form.confirm !== form.password ? 'Las contraseñas no coinciden.' : '',
    terms: terms ? '' : 'Debes aceptar los términos y condiciones.',
  }
  const visible = (f: Field) => touched[f] || submitted
  const show = (f: Field) => (visible(f) ? errors[f] : '')
  const valid = (f: Field) => visible(f) && !errors[f]
  const bind = (f: Exclude<Field, 'terms'>) => ({
    value: form[f],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [f]: e.target.value })),
    onBlur: () => setTouched((t) => ({ ...t, [f]: true })),
    error: show(f),
    valid: valid(f),
  })
  const strength = passwordStrength(form.password)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError('')
    if (Object.values(errors).some(Boolean)) return
    setLoading('form')
    const res = await register({ fullName: form.name, email: form.email, password: form.password })
    setLoading(null)
    if (!res.ok) setError(res.error)
    else toast('¡Tu cuenta fue creada con éxito!')
  }

  return (
    <AuthCard
      title="Crea tu cuenta"
      subtitle="Únete y accede a cientos de libros para aprender a tu ritmo."
      footer={
        <>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl bg-error-soft px-4 py-3 text-sm font-medium text-error">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}
        <TextField label="Nombre completo" autoComplete="name" placeholder="Ej. Javier Morales" {...bind('name')} />
        <TextField label="Correo electrónico" type="email" autoComplete="email" placeholder="tu@correo.com" {...bind('email')} />
        <div>
          <PasswordField label="Contraseña" autoComplete="new-password" placeholder="Mínimo 8 caracteres" {...bind('password')} valid={undefined} />
          {form.password && (
            <div className="mt-2" aria-live="polite">
              <div className="flex gap-1.5" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-200',
                      i < strength ? (strength <= 1 ? 'bg-error' : strength === 2 ? 'bg-warning' : 'bg-success') : 'bg-bg2',
                    )}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted">Seguridad: {STRENGTH[strength]}</p>
            </div>
          )}
        </div>
        <PasswordField label="Confirmar contraseña" autoComplete="new-password" placeholder="Repite tu contraseña" {...bind('confirm')} valid={undefined} />
        <Checkbox checked={terms} onChange={(v) => { setTerms(v); setTouched((t) => ({ ...t, terms: true })) }} error={show('terms')}>
          Acepto los <span className="font-medium text-accent">términos y condiciones</span> y la{' '}
          <span className="font-medium text-accent">política de privacidad</span>.
        </Checkbox>
        <SubmitButton loading={loading === 'form'}>Crear cuenta</SubmitButton>
      </form>
      <Divider />
      <GoogleButton
        onClick={async () => {
          setLoading('google')
          await loginWithGoogle()
          setLoading(null)
        }}
        loading={loading === 'google'}
      />
    </AuthCard>
  )
}
