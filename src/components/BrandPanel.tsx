import { Headphones, PenLine, WifiOff } from 'lucide-react'
import { BOOKS } from '../data/books'
import { cn } from '../lib/format'
import type { Book } from '../types'
import { BookCover } from './BookCover'
import { Logo } from './Logo'
import { t } from '../i18n'

const SHOWCASE = [...BOOKS].sort((a, b) => b.popularity - a.popularity).slice(0, 3)

/** Fanned stack of real covers, used on the brand panel and the home hero. */
export function CoverFan({ className, size = 'md', books = SHOWCASE }: { className?: string; size?: 'md' | 'lg'; books?: Book[] }) {
  const w = size === 'lg' ? 'w-[150px] xl:w-[170px]' : 'w-[118px]'
  return (
    <div className={cn('relative', className)} aria-hidden>
      {books.slice(0, 3).map((book, i) => (
        <div
          key={book.id}
          className={cn(
            'absolute top-1/2 left-1/2 overflow-hidden rounded-[10px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10 transition-transform duration-500 ease-out-soft',
            w,
          )}
          style={{
            transform: `translate(-50%, -50%) translateX(${(i - 1) * 62}%) rotate(${(i - 1) * 9}deg) translateY(${i === 1 ? -8 : 6}%)`,
            zIndex: i === 1 ? 2 : 1,
          }}
        >
          <BookCover book={book} />
        </div>
      ))}
    </div>
  )
}

const FEATURES = [
  { icon: PenLine, text: 'Práctica guiada al final de cada libro' },
  { icon: Headphones, text: 'Audiolibros para escuchar donde estés' },
  { icon: WifiOff, text: 'Lectura sin conexión' },
]

/** Forest brand panel shown next to the auth forms on large screens. */
export function BrandPanel() {
  return (
    <aside className="forest-panel flex h-full flex-col justify-between rounded-[28px] p-10 xl:p-12">
      <Logo onDark />
      <CoverFan size="lg" className="mx-auto my-10 h-[300px] w-full max-w-[460px] animate-float xl:h-[340px]" />
      <div>
        <span className="gold-rule" aria-hidden />
        <p className="mt-5 max-w-md font-display text-[30px] leading-[1.15] text-white xl:text-[34px]">
          {t('Cada página te acerca a quien quieres ser.')}
        </p>
        <ul className="mt-8 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-mint/80">
              <span className="grid size-8 place-items-center rounded-lg bg-white/[0.08] text-gold">
                <Icon className="size-4" aria-hidden />
              </span>
              {t(text)}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
