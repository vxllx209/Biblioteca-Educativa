import { Crown } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PremiumBanner() {
  return (
    <section className="relative overflow-hidden rounded-[18px] bg-soft p-6 sm:p-8" aria-labelledby="premium-banner-title">
      <svg className="pointer-events-none absolute -right-10 -bottom-16 size-64 text-primary opacity-[0.07] dark:text-accent" viewBox="0 0 100 100" aria-hidden>
        {[20, 32, 44].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="6" />
        ))}
      </svg>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface text-accent shadow-card">
          <Crown className="size-6" aria-hidden />
        </span>
        <div className="flex-1">
          <h2 id="premium-banner-title" className="text-lg font-semibold text-text sm:text-xl">
            Desbloquea todo el potencial
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted sm:text-[15px]">
            Accede a contenido exclusivo y disfruta de una experiencia sin límites.
          </p>
        </div>
        <Link to="/premium" className="btn-primary w-full sm:w-auto">
          Ver planes
        </Link>
      </div>
    </section>
  )
}
