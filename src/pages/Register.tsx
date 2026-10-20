import { CircleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Checkbox, Divider, GoogleButton, isEmail, PasswordField, SubmitButton, TextField } from '../components/Form'
import { AuthCard } from '../components/Layouts'
import { RoleFields } from '../components/RoleFields'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { cn } from '../lib/format'
import type { Role } from '../types'
import { t } from '../i18n'

type Field = 'name' | 'email' | 'password' | 'confirm' | 'terms' | 'school' | 'subject'

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
  const [profile, setProfile] = useState<{ role: Role; school: string; subject: string }>({ role: 'Estudiante', school: '', subject: '' })
  const [terms, setTerms] = useState(false)
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState<'form' | 'google' | null>(null)
  const [error, setError] = useState('')

  const errors: Record<Field, string> = {
    name: form.name.trim().length < 3 ? t('Ingresa tu nombre completo.') : '',
    email: !form.email.trim() ? t('Ingresa tu correo electrónico.') : !isEmail(form.email) ? t('Ingresa un correo válido.') : '',
    password: form.password.length < 8 ? t('La contraseña debe tener al menos 8 caracteres.') : '',
    confirm: !form.confirm ? t('Confirma tu contraseña.') : form.confirm !== form.password ? t('Las contraseñas no coinciden.') : '',
    terms: terms ? '' : t('Debes aceptar los términos y condiciones.'),
    school: profile.role === 'Profesor' && profile.school.trim().length < 3 ? t('Ingresa el nombre de tu establecimiento.') : '',
    subject: profile.role === 'Profesor' && !profile.subject ? t('Elige la asignatura que dictas.') : '',
  }
  const visible = (f: Field) => touched[f] || submitted
  const show = (f: Field) => (visible(f) ? errors[f] : '')
  const valid = (f: Field) => visible(f) && !errors[f]
  const bind = (f: 'name' | 'email' | 'password' | 'confirm') => ({
    value: form[f],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((s) => ({ ...s, [f]: e.target.value })),
    onBlur: () => setTouched((s) => ({ ...s, [f]: true })),
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
    const res = await register({ fullName: form.name, email: form.email, password: form.password, ...profile })
    setLoading(null)
    if (!res.ok) setError(res.error)
    else if (res.notice) toast(res.notice, 'info')
    else toast(t('¡Tu cuenta fue creada con éxito!'))
  }

  return (
    <AuthCard
      title={t('Crea tu cuenta')}
      subtitle={t('Clásicos completos, audiolibros y prácticas para aprender a tu ritmo.')}
      footer={
        <>
          {t('¿Ya tienes una cuenta?')}{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            {t('Inicia sesión')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="stagger space-y-5">
        <RoleFields
          {...profile}
          onChange={(patch) => setProfile((p) => ({ ...p, ...patch }))}
          errors={submitted ? { school: errors.school, subject: errors.subject } : {}}
        />
        {error && (
          <div key={error} role="alert" className="animate-shake flex items-center gap-2 rounded-xl bg-error-soft px-4 py-3 text-sm font-medium text-error">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}
        <TextField label={t('Nombre completo')} autoComplete="name" placeholder={t('Ej. Javier Morales')} {...bind('name')} />
        <TextField label={t('Correo electrónico')} type="email" autoComplete="email" placeholder={t('tu@correo.com')} {...bind('email')} />
        <div>
          <PasswordField label={t('Contraseña')} autoComplete="new-password" placeholder={t('Mínimo 8 caracteres')} {...bind('password')} valid={undefined} />
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
              <p className="mt-1 text-xs text-muted">{t('Seguridad: {level}', { level: t(STRENGTH[strength]) })}</p>
            </div>
          )}
        </div>
        <PasswordField label={t('Confirmar contraseña')} autoComplete="new-password" placeholder={t('Repite tu contraseña')} {...bind('confirm')} valid={undefined} />
        <Checkbox checked={terms} onChange={(v) => { setTerms(v); setTouched((s) => ({ ...s, terms: true })) }} error={show('terms')}>
          {t('Acepto los')} <span className="font-medium text-accent">{t('términos y condiciones')}</span> {t('y la')}{' '}
          <span className="font-medium text-accent">{t('política de privacidad')}</span>.
        </Checkbox>
        <SubmitButton loading={loading === 'form'}>{t('Crear cuenta')}</SubmitButton>
      </form>
      <Divider />
      <GoogleButton
        onClick={async () => {
          setLoading('google')
          setError('')
          const res = await loginWithGoogle()
          setLoading(null)
          if (!res.ok) setError(res.error)
        }}
        loading={loading === 'google'}
      />
    </AuthCard>
  )
}
