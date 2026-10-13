import { en } from './en'

export type Lang = 'es' | 'en'

/**
 * UI strings are written in Spanish and double as their own keys: `t('Mis tareas')`.
 * English comes from ./en.ts; a missing entry falls back to the Spanish text
 * (`node scripts/check-i18n.mjs` lists them). Placeholders look like `{name}`.
 */
let current: Lang = 'es'

/** Called by PreferencesProvider while rendering, so every screen below it sees the new language. */
export const setLang = (lang: Lang) => {
  current = lang
}
export const getLang = () => current

/** Locale for dates and numbers. */
export const locale = () => (current === 'en' ? 'en-US' : 'es-CL')

export function t(text: string, vars?: Record<string, string | number>) {
  const out = current === 'en' ? (en[text] ?? text) : text
  return vars ? out.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : out
}

/** Singular or plural form with `{n}` filled in: `plural(n, '{n} día', '{n} días')`. */
export const plural = (n: number, one: string, many: string) => t(n === 1 ? one : many, { n })
