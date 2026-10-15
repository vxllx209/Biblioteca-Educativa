import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CoverFan } from '../components/BrandPanel'
import { GoogleButton } from '../components/Form'
import { Logo } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { t } from '../i18n'

export default function Welcome() {
  const { loginWithGoogle } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const google = async () => {
    setLoading(true)
    const res = await loginWithGoogle()
    setLoading(false)
    if (res.ok) toast(t('¡Bienvenido de nuevo!'))
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2 lg:gap-4 lg:p-4">
      {/* Brand stage: full-bleed on mobile, rounded panel on desktop. */}
      <section className="forest-panel flex flex-col px-6 pt-8 pb-14 sm:px-10 lg:rounded-[28px] lg:p-12">
        <Logo onDark />
        <CoverFan className="mx-auto mt-10 h-[230px] w-full max-w-[380px] animate-float sm:h-[260px] lg:my-auto lg:h-[340px] lg:max-w-[460px]" size="md" />
        <div className="mt-10 lg:mt-0">
          <span className="gold-rule" aria-hidden />
          <h1 className="mt-5 max-w-lg font-display text-[34px] leading-[1.08] text-white sm:text-5xl">
            {t('Tu biblioteca digital para aprender, descubrir y crecer.')}
          </h1>
        </div>
      </section>

      <section className="relative -mt-6 flex items-center justify-center rounded-t-[28px] bg-bg px-6 pt-10 pb-12 lg:mt-0 lg:rounded-none lg:bg-transparent">
        <div className="w-full max-w-sm animate-rise">
          <p className="eyebrow">{t('Bienvenido')}</p>
          <h2 className="mt-2 font-display text-[28px] leading-tight text-text sm:text-[32px]">{t('Empieza a leer hoy')}</h2>
          <p className="mt-2 text-[15px] text-muted">{t('Libros, audiolibros y práctica guiada en un solo lugar.')}</p>

          <div className="mt-9 flex w-full flex-col gap-3">
            <Link to="/login" className="btn-primary group h-12">
              {t('Iniciar sesión')}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link to="/register" className="btn-secondary h-12">
              {t('Crear cuenta')}
            </Link>
            <div className="my-2 flex items-center gap-4 text-xs font-medium text-disabled" role="separator">
              <span className="h-px flex-1 bg-line" />{t('o')}<span className="h-px flex-1 bg-line" />
            </div>
            <GoogleButton onClick={google} loading={loading} />
          </div>
          {!supabase && (
            <p className="mt-10 rounded-xl border border-dashed border-line px-4 py-3 text-center text-xs text-muted">
              {t('Cuenta de demostración:')} javier@biblioteca.edu · demo1234
            </p>
          )}
        </div>
      </section>
    </main>
  )
}
