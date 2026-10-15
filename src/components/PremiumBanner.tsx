import { ArrowRight, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { t } from '../i18n'

export function PremiumBanner() {
  return (
    <section className="forest-panel rounded-feature p-6 shadow-lift sm:p-9" aria-labelledby="premium-banner-title">
      <svg className="pointer-events-none absolute -right-16 -bottom-24 size-80 text-gold opacity-20" viewBox="0 0 100 100" aria-hidden>
        {[18, 28, 38, 48].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="0.5" />
        ))}
      </svg>
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-gold to-[#a8732f] text-[#1f1607] shadow-[0_12px_28px_-10px_rgba(217,163,91,0.9)]">
          <Crown className="size-7" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">Premium</p>
          <h2 id="premium-banner-title" className="mt-1 font-display text-2xl text-white sm:text-[28px]">
            {t('Desbloquea todo el potencial')}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-mint/75 sm:text-[15px]">
            {t('Accede a contenido exclusivo y disfruta de una experiencia sin límites.')}
          </p>
        </div>
        <Link to="/premium" className="btn-gold group w-full sm:w-auto">
          {t('Ver planes')}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
