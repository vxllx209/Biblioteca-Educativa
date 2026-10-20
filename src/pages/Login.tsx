import { CircleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Divider, GoogleButton, isEmail, PasswordField, SubmitButton, TextField } from '../components/Form'
import { AuthCard } from '../components/Layouts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { t } from '../i18n'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState<'form' | 'google' | null>(null)
  const [error, setError] = useState('')

  const errors = {
    email: !email.trim() ? t('Ingresa tu correo electrónico.') : !isEmail(email) ? t('Ingresa un correo válido.') : '',
    password: !password ? t('Ingresa tu contraseña.') : '',
  }
  const show = (f: keyof typeof errors) => (touched[f] || submitted ? errors[f] : '')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError('')
    if (errors.email || errors.password) return
    setLoading('form')
    const res = await login(email, password)
    setLoading(null)
    if (!res.ok) setError(res.error)
    else toast(t('¡Hola de nuevo!'))
  }

  const google = async () => {
    setLoading('google')
    setError('')
    const res = await loginWithGoogle()
    setLoading(null)
    if (!res.ok) setError(res.error)
  }

  return (
    <AuthCard
      title={t('Bienvenido de nuevo')}
      subtitle={t('Inicia sesión para continuar aprendiendo.')}
      brandTitle={t('Tu próxima página te espera.')}
      footer={
        <>
          {t('¿No tienes una cuenta?')}{' '}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            {t('Crear cuenta')}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="stagger space-y-5">
        {error && (
          <div key={error} role="alert" className="animate-shake flex items-center gap-2 rounded-xl bg-error-soft px-4 py-3 text-sm font-medium text-error">
            <CircleAlert className="size-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}
        <TextField
          label={t('Correo electrónico')}
          type="email"
          autoComplete="email"
          placeholder={t('tu@correo.com')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, email: true }))}
          error={show('email')}
        />
        <div>
          <PasswordField
            label={t('Contraseña')}
            autoComplete="current-password"
            placeholder={t('Tu contraseña')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((s) => ({ ...s, password: true }))}
            error={show('password')}
          />
          <div className="mt-2 flex justify-end">
            <Link to="/forgot-password" className="py-1 text-sm font-medium text-accent hover:underline">
              {t('¿Olvidaste tu contraseña?')}
            </Link>
          </div>
        </div>
        <SubmitButton loading={loading === 'form'}>{t('Iniciar sesión')}</SubmitButton>
      </form>
      <Divider />
      <GoogleButton onClick={google} loading={loading === 'google'} />
    </AuthCard>
  )
}
