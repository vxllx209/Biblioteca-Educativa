import { Search, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { cn } from '../lib/format'

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  size?: 'md' | 'lg'
  className?: string
  label?: string
  autoFocus?: boolean
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = '¿Qué te gustaría aprender?',
  size = 'md',
  className,
  label = 'Buscar libros',
  autoFocus,
}: Props) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit?.(value)
  }
  return (
    <form role="search" onSubmit={handleSubmit} className={cn('relative', className)}>
      <label className="sr-only" htmlFor={`search-${label}`}>
        {label}
      </label>
      <Search
        className={cn('pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted', size === 'lg' ? 'size-5' : 'size-[18px]')}
        aria-hidden
      />
      <input
        id={`search-${label}`}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'field pr-11 [&::-webkit-search-cancel-button]:hidden',
          size === 'lg' ? 'h-14 rounded-[14px] pl-12 text-base shadow-card' : 'pl-11',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:bg-bg2 hover:text-text"
          aria-label="Limpiar búsqueda"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  )
}
