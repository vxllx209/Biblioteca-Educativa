import { Activity, AlarmClock, ArrowDownWideNarrow, Award, ChevronRight, CircleDashed, ClipboardCheck, GraduationCap, Inbox, Moon, Target, TriangleAlert, Users, type LucideIcon } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { ENGAGEMENT_FILTER_LABEL, summarizeCourse, type Alert, type Engagement, type StudentData, type StudentSummary } from '../../data/insights'
import { getPaesQuestion, getPassage, SKILLS } from '../../data/paes'
import { formatGrade, PASSING_GRADE } from '../../data/school'
import { cn, formatDate } from '../../lib/format'
import type { Assignment, Course, Member, Submission } from '../../services/classroom'
import { plural, t } from '../../i18n'
import { Modal } from '../Modal'
import { SectionHeader } from '../PageHeader'
import { EmptyState } from '../States'
import { DayBars, SkillBars, StatTile } from './Charts'
import { EngagementBadge, ENGAGEMENT_STYLE, lastActiveLabel, MemberAvatar } from './Engagement'
import { StudentDetail } from './StudentDetail'

type Sort = 'riesgo' | 'nombre' | 'paes' | 'puntos'
type Filter = 'todos' | Engagement

const SORTS: { value: Sort; label: string }[] = [
  { value: 'riesgo', label: 'Primero los que necesitan apoyo' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'paes', label: 'Resultado PAES' },
  { value: 'puntos', label: 'Puntos de la semana' },
]

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`)

function AlertCard({ alert, onOpen }: { alert: Alert; onOpen: (s: StudentSummary) => void }) {
  const names = (list: StudentSummary[]) => (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {list.slice(0, 6).map((s) => (
        <button key={s.member.studentId} onClick={() => onOpen(s)} className="chip border-line bg-surface py-1 text-xs text-text hover:border-line-active">
          {s.member.name}
        </button>
      ))}
      {list.length > 6 && <span className="self-center text-xs text-muted">{t('y {n} más', { n: list.length - 6 })}</span>}
    </span>
  )
  const view = ((): { icon: LucideIcon; tone: string; title: string; body: ReactNode } => {
    switch (alert.kind) {
      case 'inactivos':
        return {
          icon: Moon,
          tone: 'bg-error-soft text-error',
          title: plural(alert.students.length, '{n} estudiante sin actividad hace una semana o más', '{n} estudiantes sin actividad hace una semana o más'),
          body: names(alert.students),
        }
      case 'sin-empezar':
        return {
          icon: CircleDashed,
          tone: 'bg-bg2 text-muted',
          title: plural(alert.students.length, '{n} estudiante aún no empieza a estudiar en la app', '{n} estudiantes aún no empiezan a estudiar en la app'),
          body: names(alert.students),
        }
      case 'en-riesgo':
        return {
          icon: TriangleAlert,
          tone: 'bg-warning-soft text-warning',
          title: plural(alert.students.length, '{n} estudiante bajó su ritmo (3 a 6 días sin estudiar)', '{n} estudiantes bajaron su ritmo (3 a 6 días sin estudiar)'),
          body: names(alert.students),
        }
      case 'atrasadas':
        return {
          icon: AlarmClock,
          tone: 'bg-warning-soft text-warning',
          title: plural(alert.students.length, '{n} estudiante con tareas vencidas sin entregar', '{n} estudiantes con tareas vencidas sin entregar'),
          body: names(alert.students),
        }
      case 'habilidad':
        return {
          icon: Target,
          tone: 'bg-soft text-accent',
          title: t('El curso necesita reforzar {skill} ({pct} de logro)', { skill: t(SKILLS[alert.skill].label), pct: pct(alert.pct) }),
          body: <span className="mt-1 block text-[13px] text-muted">{t('Pídeles practicarla en Preparación PAES o trabaja una lectura en clase.')}</span>,
        }
      case 'por-revisar':
        return {
          icon: Inbox,
          tone: 'bg-soft text-accent',
          title: plural(alert.count, '{n} entrega por revisar', '{n} entregas por revisar'),
          body: <span className="mt-1 block text-[13px] text-muted">{t('Ábrelas desde la pestaña Tareas. El tutor con IA puede sugerirte una nota.')}</span>,
        }
    }
  })()
  const Icon = view.icon
  return (
    <li className="card flex gap-3 p-4">
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', view.tone)}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{view.title}</p>
        {view.body}
      </div>
    </li>
  )
}

export function CourseDashboard({
  course,
  members,
  assignments,
  submissions,
  data,
}: {
  course: Course
  members: Member[]
  assignments: Assignment[]
  submissions: Submission[]
  data: Record<string, StudentData>
}) {
  const summary = useMemo(() => summarizeCourse(members, data, assignments, submissions), [members, data, assignments, submissions])
  const [sort, setSort] = useState<Sort>('riesgo')
  const [filter, setFilter] = useState<Filter>('todos')
  const [open, setOpen] = useState<StudentSummary | null>(null)

  const students = useMemo(() => {
    const list = summary.students.filter((s) => filter === 'todos' || s.engagement === filter)
    const by: Record<Sort, (a: StudentSummary, b: StudentSummary) => number> = {
      riesgo: (a, b) => ENGAGEMENT_STYLE[a.engagement].order - ENGAGEMENT_STYLE[b.engagement].order || (b.daysInactive ?? 999) - (a.daysInactive ?? 999),
      nombre: (a, b) => a.member.name.localeCompare(b.member.name, 'es'),
      paes: (a, b) => (b.paesPct ?? -1) - (a.paesPct ?? -1),
      puntos: (a, b) => b.weekPoints - a.weekPoints,
    }
    return [...list].sort(by[sort])
  }, [summary.students, filter, sort])

  if (!members.length)
    return (
      <EmptyState
        icon={Users}
        title={t('Aún no hay estudiantes')}
        description={t('Cuando se unan con el código {code}, aquí verás su actividad, sus resultados PAES y quién necesita apoyo.', { code: course.joinCode })}
      />
    )

  const counts = summary.students.reduce<Record<Engagement, number>>(
    (acc, s) => ({ ...acc, [s.engagement]: acc[s.engagement] + 1 }),
    { activo: 0, 'en-riesgo': 0, inactivo: 0, 'sin-actividad': 0 },
  )
  const paesStudents = summary.students.filter((s) => s.paesAnswered > 0).length
  const today = formatDate(new Date().toISOString(), { day: 'numeric', month: 'long' })

  return (
    <div className="stagger space-y-10">
      <section aria-label={t('Resumen del curso')} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Activity} value={`${summary.activeThisWeek}/${members.length}`} label={t('Activos esta semana')} hint={t('Estudiaron en los últimos 7 días')} />
        <StatTile
          icon={GraduationCap}
          value={pct(avgPaes(summary.students))}
          label={t('Logro PAES promedio')}
          hint={plural(paesStudents, '{n} estudiante ha practicado', '{n} estudiantes han practicado')}
        />
        <StatTile icon={ClipboardCheck} value={pct(summary.deliveryRate)} label={t('Entregas al día')} hint={t('De las tareas ya vencidas o entregadas')} />
        <StatTile
          icon={Award}
          value={summary.avgGrade === null ? '—' : formatGrade(summary.avgGrade)}
          label={t('Promedio de notas')}
          hint={summary.pendingReviews ? t('{n} por revisar', { n: summary.pendingReviews }) : t('Todo revisado')}
          tone={summary.avgGrade !== null && summary.avgGrade < PASSING_GRADE ? 'warning' : 'default'}
        />
      </section>

      {summary.alerts.length > 0 && (
        <section aria-labelledby="alerts-title">
          <SectionHeader id="alerts-title" title={t('Necesita tu atención')} />
          <ul className="grid gap-3 lg:grid-cols-2">
            {summary.alerts.map((a) => (
              <AlertCard key={a.kind} alert={a} onOpen={setOpen} />
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="card p-5 sm:p-6" aria-labelledby="activity-title">
          <h2 id="activity-title" className="font-semibold text-text">
            {t('Estudiantes activos por día')}
          </h2>
          <p className="mb-6 text-[13px] text-muted">{t('Últimos 14 días, hasta hoy {date}', { date: today })}</p>
          <DayBars
            days={summary.daily.map((d) => ({ ...d, value: d.count }))}
            max={members.length}
            label={t('Estudiantes activos por día')}
            format={(d) =>
              `${formatDate(d.date.toISOString(), { weekday: 'short', day: 'numeric', month: 'short' })} · ${t('{n} de {total} activos', { n: d.value, total: members.length })}`
            }
          />
          <dl className="mt-6 grid grid-cols-4 gap-2 border-t border-line pt-4 text-center">
            {(['activo', 'en-riesgo', 'inactivo', 'sin-actividad'] as const).map((e) => (
              <div key={e}>
                <dt className="sr-only">{e}</dt>
                <dd className="font-display text-xl text-text tabular-nums">{counts[e]}</dd>
                <dd className="mt-1 flex justify-center">
                  <EngagementBadge engagement={e} />
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="skills-title">
          <h2 id="skills-title" className="font-semibold text-text">
            {t('Mapa de habilidades PAES del curso')}
          </h2>
          <p className="mb-6 text-[13px] text-muted">{t('Porcentaje de respuestas correctas de todo el curso, según la última respuesta de cada estudiante.')}</p>
          <SkillBars
            highlight={summary.weakestSkill}
            values={summary.skills}
            note={(k) => {
              const v = summary.skills[k]
              return v.answered ? t('{n} respuestas · {students} estudiantes', { n: v.answered, students: v.students }) : t('Sin respuestas todavía')
            }}
          />
        </section>
      </div>

      {summary.hardest.length > 0 && (
        <section aria-labelledby="hard-title">
          <SectionHeader id="hard-title" title={t('Las preguntas que más cuestan')} />
          <ol className="grid gap-3 md:grid-cols-2">
            {summary.hardest.map((h, i) => {
              const q = getPaesQuestion(h.id)!
              const passage = getPassage(q.passageId)
              const wrong = h.wrong / h.answered
              return (
                <li key={h.id} className="card flex gap-4 p-4">
                  <span className="font-display text-2xl leading-none text-muted tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">{q.prompt}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t(SKILLS[q.skill].label)}
                      {passage && ` · ${passage.title}`}
                    </p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft" role="img" aria-label={t('{pct} de error', { pct: pct(wrong) })}>
                        <div className="h-full rounded-full bg-error" style={{ width: `${wrong * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted tabular-nums">{t('{wrong} de {n} fallaron', { wrong: h.wrong, n: h.answered })}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section aria-labelledby="students-title">
        <SectionHeader id="students-title" title={t('Estudiantes')} />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label={t('Filtrar por estado')}>
            {(['todos', 'activo', 'en-riesgo', 'inactivo', 'sin-actividad'] as const).map((f) =>
              f !== 'todos' && !counts[f] ? null : (
                <button
                  key={f}
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn('chip shrink-0', filter === f ? 'chip-active' : 'border-line bg-surface text-muted hover:text-text')}
                >
                  {f === 'todos' ? t('Todos ({n})', { n: members.length }) : `${t(ENGAGEMENT_FILTER_LABEL[f])} (${counts[f]})`}
                </button>
              ),
            )}
          </div>
          <label className="ml-auto flex items-center gap-2 text-[13px] text-muted">
            <ArrowDownWideNarrow className="size-4" aria-hidden />
            <span className="sr-only">{t('Ordenar por')}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field h-9 w-auto py-0 pr-8 text-[13px]">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {t(s.label)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Table on wide screens, cards on phones. */}
        <div className="card hidden overflow-hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-bg2/60 text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t('Estudiante')}</th>
                <th className="px-3 py-3 font-medium">{t('Estado')}</th>
                <th className="px-3 py-3 font-medium">{t('Última actividad')}</th>
                <th className="px-3 py-3 text-right font-medium">{t('Racha')}</th>
                <th className="px-3 py-3 text-right font-medium">{t('Pts. semana')}</th>
                <th className="px-3 py-3 text-right font-medium">{t('PAES')}</th>
                <th className="px-3 py-3 font-medium">{t('A reforzar')}</th>
                <th className="px-3 py-3 text-right font-medium">{t('Entregas')}</th>
                <th className="px-3 py-3 text-right font-medium">{t('Promedio')}</th>
                <th className="w-10 px-2 py-3">
                  <span className="sr-only">{t('Ver detalle')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {students.map((s) => (
                <tr key={s.member.studentId} className="cursor-pointer transition-colors hover:bg-bg2/60" onClick={() => setOpen(s)}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <MemberAvatar name={s.member.name} color={s.member.avatarColor} />
                      <span className="font-semibold text-text">{s.member.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <EngagementBadge engagement={s.engagement} />
                  </td>
                  <td className="px-3 py-3 text-muted">{lastActiveLabel(s.daysInactive)}</td>
                  <td className="px-3 py-3 text-right text-text tabular-nums">{s.streak ? plural(s.streak, '{n} día', '{n} días') : '—'}</td>
                  <td className="px-3 py-3 text-right text-text tabular-nums">{s.weekPoints}</td>
                  <td className="px-3 py-3 text-right text-text tabular-nums">{pct(s.paesPct)}</td>
                  <td className="px-3 py-3 text-muted">{s.weakestSkill ? t(SKILLS[s.weakestSkill].label) : '—'}</td>
                  <td className="px-3 py-3 text-right text-text tabular-nums">
                    {s.sent}/{assignments.length}
                    {s.missing > 0 && <AlarmClock className="ml-1 inline size-3.5 text-warning" aria-label={plural(s.missing, '{n} atrasada', '{n} atrasadas')} />}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-text tabular-nums">{s.avgGrade === null ? '—' : formatGrade(s.avgGrade)}</td>
                  <td className="px-2 py-3">
                    <button onClick={() => setOpen(s)} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-bg2 hover:text-text" aria-label={t('Ver detalle de {name}', { name: s.member.name })}>
                      <ChevronRight className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-3 md:hidden">
          {students.map((s) => (
            <li key={s.member.studentId}>
              <button onClick={() => setOpen(s)} className="card card-hover flex w-full items-center gap-3 p-4 text-left">
                <MemberAvatar name={s.member.name} color={s.member.avatarColor} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-text">{s.member.name}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {lastActiveLabel(s.daysInactive)} · {t('PAES')} {pct(s.paesPct)} · {s.weekPoints} {t('pts')}
                  </span>
                </span>
                <EngagementBadge engagement={s.engagement} />
              </button>
            </li>
          ))}
        </ul>
        {!students.length && <p className="py-6 text-center text-sm text-muted">{t('Ningún estudiante en este filtro.')}</p>}

        <p className="mt-4 text-xs text-muted">
          {t('Activo: estudió en los últimos 2 días · En riesgo: 3 a 6 días sin estudiar · Inactivo: 7 días o más.')}
        </p>
      </section>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.member.name ?? ''} description={course.name} size="lg">
        {open && <StudentDetail s={open} />}
      </Modal>
    </div>
  )
}

/** Average of each student's PAES success rate (students who practised). */
function avgPaes(students: StudentSummary[]) {
  const list = students.filter((s) => s.paesPct !== null)
  return list.length ? list.reduce((n, s) => n + s.paesPct!, 0) / list.length : null
}
