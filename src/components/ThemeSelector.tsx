import { Monitor, Moon, Sun } from 'lucide-react'
import { usePreferences } from '../context/PreferencesContext'
import { cn } from '../lib/format'
import type { ThemeMode } from '../types'

const OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'auto', label: 'Automático', icon: Monitor },
]

export function ThemeSelector() {
  const { prefs, setPref } = usePreferences()
  return (
    <div role="radiogroup" aria-label="Tema de la aplicación" className="grid grid-cols-3 gap-3">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = prefs.theme === value
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            onClick={() => setPref('theme', value)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-[14px] border px-3 py-4 text-sm font-medium transition-all duration-200',
              active ? 'border-primary bg-softer text-accent dark:border-secondary' : 'border-line text-muted hover:border-line-active',
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
