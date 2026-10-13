import { ArrowLeft, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { isEmail, SubmitButton, TextField } from '../components/Form'
import { AuthCard } from '../components/Layouts'
import { useAuth } from '../context/AuthContext'
import { t } from '../i18n'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const error = !email.trim() ? t('Ingresa tu correo electrónico.') : !isEmail(email) ? t('Ingresa un correo válido.') : ''

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (error) return
    setLoading(true)
    await requestPasswordReset(email)
    setLoading(false)
    setSent(true)
  }

  const backLink = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline">
      <ArrowLeft className="size-4" aria-hidden /> {t('Volver a iniciar sesión')}
    </Link>
  )

  if (sent)
    return (
      <AuthCard title={t('Revisa tu correo')} subtitle={t('Te enviamos las instrucciones para recuperar tu contraseña.')} footer={backLink}>
        <div className="flex flex-col items-center text-center" role="status">
          <span className="grid size-16 place-items-center rounded-full bg-success-soft text-success">
            <MailCheck className="size-7" aria-hidden />
          </span>
          <p className="mt-5 text-[15px] text-muted">
            {t('Si existe una cuenta asociada a')} <span className="font-semibold text-text">{email}</span>
            {t(', recibirás un enlace para restablecer tu contraseña en los próximos minutos.')}
          </p>
          <button className="btn-secondary mt-8 w-full" onClick={() => setSent(false)}>
            {t('Usar otro correo')}
          </button>
        </div>
      </AuthCard>
    )

  return (
    <AuthCard
      title={t('Recupera tu contraseña')}
      subtitle={t('Ingresa el correo con el que te registraste y te enviaremos un enlace para crear una nueva contraseña.')}
      footer={backLink}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <TextField
          label={t('Correo electrónico')}
          type="email"
          autoComplete="email"
          placeholder={t('tu@correo.com')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched ? error : ''}
        />
        <SubmitButton loading={loading}>{t('Enviar enlace')}</SubmitButton>
      </form>
    </AuthCard>
  )
}
