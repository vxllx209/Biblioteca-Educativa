import { GraduationCap, Presentation } from 'lucide-react'
import { useId } from 'react'
import { ROLES, SUBJECTS } from '../data/school'
import { cn } from '../lib/format'
import type { Role } from '../types'
import { TextField } from './Form'
import { t } from '../i18n'

const ICONS = { Estudiante: GraduationCap, Profesor: Presentation }

/** Interactive role picker; teachers also give the two profile fields the database stores for them. */
export function RoleFields({
  role,
  school,
  subject,
  onChange,
  errors = {},
}: {
  role: Role
  school: string
  subject: string
  onChange: (patch: Partial<{ role: Role; school: string; subject: string }>) => void
  errors?: { school?: string; subject?: string }
}) {
  const subjectId = useId()
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="label">{t('¿Cómo vas a usar la biblioteca?')}</legend>
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => {
            const Icon = ICONS[r.value]
            const active = role === r.value
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ role: r.value })}
                className={cn(
                  'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                  active ? 'border-primary bg-soft' : 'border-line bg-surface hover:border-line-active',
                )}
              >
                <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', active ? 'bg-primary text-white' : 'bg-bg2 text-muted')}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-text">{t(r.title)}</span>
                  <span className="block text-xs text-muted">{t(r.description)}</span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {role === 'Profesor' && (
        <div className="animate-fade-in space-y-4 rounded-xl border border-line bg-softer p-4">
          <TextField
            label={t('Establecimiento')}
            placeholder={t('Ej. Liceo Bicentenario de Talca')}
            autoComplete="organization"
            value={school}
            onChange={(e) => onChange({ school: e.target.value })}
            error={errors.school}
          />
          <div>
            <label htmlFor={subjectId} className="label">
              {t('Asignatura que dictas')}
            </label>
            <select
              id={subjectId}
              value={subject}
              onChange={(e) => onChange({ subject: e.target.value })}
              aria-invalid={!!errors.subject}
              className={cn('field', errors.subject && 'border-error')}
            >
              <option value="">{t('Elige una asignatura')}</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </select>
            {errors.subject && <p className="mt-1.5 text-[13px] text-error">{errors.subject}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
