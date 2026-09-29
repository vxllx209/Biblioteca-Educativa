import { BookOpen } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GoogleButton } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Welcome() {
  const { loginWithGoogle } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const google = async () => {
    setLoading(true)
    const res = await loginWithGoogle()
    setLoading(false)
    if (res.ok) toast('¡Bienvenido de nuevo!')
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-6 py-12">
      <svg className="pointer-events-none absolute -top-40 -right-40 size-[520px] text-soft" viewBox="0 0 100 100" aria-hidden>
        {[18, 30, 42].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="0.6" />
        ))}
      </svg>
      <svg className="pointer-events-none absolute -bottom-48 -left-48 size-[560px] text-soft" viewBox="0 0 100 100" aria-hidden>
        {[22, 34, 46].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="0.6" />
        ))}
      </svg>

      <div className="relative flex w-full max-w-sm animate-rise flex-col items-center text-center">
        <span className="grid size-24 place-items-center rounded-full bg-soft text-accent sm:size-28">
          <BookOpen className="size-11 sm:size-12" strokeWidth={1.6} aria-hidden />
        </span>
        <h1 className="mt-8 text-[26px] font-bold tracking-tight text-text sm:text-4xl">Biblioteca Educativa</h1>
        <p className="mt-3 text-base text-muted sm:text-lg">Tu biblioteca digital para aprender, descubrir y crecer.</p>

        <div className="mt-12 flex w-full flex-col gap-3">
          <Link to="/login" className="btn-primary h-12">
            Iniciar sesión
          </Link>
          <Link to="/register" className="btn-secondary h-12">
            Crear cuenta
          </Link>
          <div className="my-2 flex items-center gap-4 text-xs font-medium text-disabled" role="separator">
            <span className="h-px flex-1 bg-line" />o<span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton onClick={google} loading={loading} />
        </div>
        <p className="mt-10 text-xs text-disabled">
          Cuenta de demostración: javier@biblioteca.edu · demo1234
        </p>
      </div>
    </main>
  )
}
