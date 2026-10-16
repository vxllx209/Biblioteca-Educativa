/**
 * Lists interface strings that have no English translation in src/i18n/en.ts: bun scripts/check-i18n.ts
 * Book texts and practice questions stay in Spanish on purpose; this only covers the interface.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { BOOKS, CATEGORIES } from '../src/data/books'
import { NOTIFICATIONS, PLANS, TASKS } from '../src/data/mock'
import { KIND_LABEL, SUBJECT_APPROACH } from '../src/data/practice'
import { AREAS, MASTERY_LABEL, MODE_LABEL, PAES_QUESTIONS, SKILLS } from '../src/data/paes'
import { BADGE_INFO } from '../src/data/motivation'
import { ENGAGEMENT_FILTER_LABEL, ENGAGEMENT_LABEL } from '../src/data/insights'
import { ROLES, SUBJECTS } from '../src/data/school'
import { navItems } from '../src/components/nav'
import { en } from '../src/i18n/en'

const SRC = join(import.meta.dir, '../src')
const keys = new Set<string>()

// 1. Literal keys: t('…'), plural(n, '…', '…').
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : /\.tsx?$/.test(f) ? [join(dir, f)] : []))
const literal = String.raw`'((?:[^'\\]|\\.)*)'`
for (const file of files(SRC)) {
  if (/i18n|library\.generated|data[\\/]practice[\\/](?!index)/.test(file)) continue
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(new RegExp(String.raw`\bt\(\s*` + literal, 'g'))) keys.add(m[1])
  for (const m of src.matchAll(new RegExp(String.raw`\bplural\([^,]+,\s*` + literal + String.raw`,\s*` + literal, 'g'))) {
    keys.add(m[1])
    keys.add(m[2])
  }
  // 2. Labels kept in local constants and translated where they are rendered: t(label), t(f.label)…
  if (/[\\/](pages|components)[\\/]/.test(file))
    for (const m of src.matchAll(new RegExp(String.raw`\b(?:label|title|text|q|a|shortLabel): ` + literal, 'g'))) keys.add(m[1])
}
for (const m of readFileSync(join(SRC, 'components/StatusBadge.tsx'), 'utf8').matchAll(/: '([A-Z][^']*)'/g)) keys.add(m[1])
for (const m of readFileSync(join(SRC, 'pages/Register.tsx'), 'utf8').match(/STRENGTH = \[(.*)\]/)![1].matchAll(new RegExp(literal, 'g'))) keys.add(m[1])
for (const m of readFileSync(join(SRC, 'pages/AssignmentReview.tsx'), 'utf8').matchAll(new RegExp(String.raw`\['[\w-]+', ` + literal + String.raw`\]`, 'g'))) keys.add(m[1])

// 3. Data rendered through t().
const data = [
  ...CATEGORIES,
  ...SUBJECTS,
  ...Object.values(KIND_LABEL),
  ...Object.values(SUBJECT_APPROACH),
  ...ROLES.flatMap((r) => [r.value, r.title, r.description]),
  ...navItems('Estudiante').concat(navItems('Profesor')).flatMap((i) => [i.label, i.shortLabel ?? i.label]),
  ...PLANS.flatMap((p) => [p.name, p.description, p.period ?? '', ...p.features.map((f) => f.label)]),
  ...NOTIFICATIONS.flatMap((n) => [n.title, n.body]),
  ...TASKS.flatMap((t) => [t.title, t.subject, t.description]),
  ...BOOKS.flatMap((b) => [b.language, b.subject, ...(b.levels ?? [])]),
  ...AREAS.flatMap((a) => [a.title, a.description]),
  ...Object.values(SKILLS).flatMap((s) => [s.label, s.description]),
  ...Object.values(MASTERY_LABEL),
  ...Object.values(MODE_LABEL),
  ...Object.values(BADGE_INFO).flatMap((b) => [b.title, b.description]),
  ...PAES_QUESTIONS.map((q) => q.ability ?? ''),
  ...Object.values(ENGAGEMENT_LABEL),
  ...Object.values(ENGAGEMENT_FILTER_LABEL),
]
data.filter(Boolean).forEach((k) => keys.add(k))

keys.delete('')
const missing = [...keys].filter((k) => !(k in en)).sort()
const unused = Object.keys(en).filter((k) => !keys.has(k))
const interp = [...keys].filter((k) => k in en && JSON.stringify(k.match(/\{\w+\}/g)?.sort()) !== JSON.stringify(en[k].match(/\{\w+\}/g)?.sort()))
if (process.argv.includes('--json')) console.log(JSON.stringify(missing, null, 2))
else {
  for (const k of missing) console.log('falta:', JSON.stringify(k))
  for (const k of interp) console.log('variables distintas:', JSON.stringify(k))
  for (const k of unused) console.log('sin uso:', JSON.stringify(k))
  console.log(`${keys.size} textos · ${missing.length} sin traducir · ${interp.length} con variables distintas · ${unused.length} sin uso`)
}
if (missing.length || interp.length) process.exit(1)
