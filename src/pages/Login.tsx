import { CircleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Divider, GoogleButton, isEmail, PasswordField, SubmitButton, TextField } from '../components/Form'
import { AuthCard } from '../components/Layouts'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

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
    email: !email.trim() ? 'Ingresa tu correo electrónico.' : !isEmail(email) ? 'Ingresa un correo válido.' : '',
    password: !password ? 'Ingresa tu contraseña.' : '',
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
    else toast(`¡Hola de nuevo!`)
  }

  const google = async () => {
    setLoading('google')
    await loginWithGoogle()
    setLoading(null)
  }

  return (
    <AuthCard
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión para continuar aprendiendo."
      footer={
        <>
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            Crear cuenta
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
        <TextField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={show('email')}
        />
        <div>
          <PasswordField
            label="Contraseña"
            autoComplete="current-password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={show('password')}
          />
          <div className="mt-2 flex justify-end">
            <Link to="/forgot-password" className="py-1 text-sm font-medium text-accent hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
        <SubmitButton loading={loading === 'form'}>Iniciar sesión</SubmitButton>
      </form>
      <Divider />
      <GoogleButton onClick={google} loading={loading === 'google'} />
    </AuthCard>
  )
}
