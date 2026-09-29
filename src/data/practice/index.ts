import type { AnswerValue, Book, Category, PracticeKind, PracticeSet, Question } from '../../types'
import { normalize } from '../../lib/format'
import { HUMANITIES_SETS } from './humanities'
import { SCIENCE_SETS } from './sciences'

export const PRACTICE_SETS: PracticeSet[] = [...SCIENCE_SETS, ...HUMANITIES_SETS]

export const KIND_LABEL: Record<PracticeKind, string> = {
  ejercicios: 'Ejercicios de aplicación',
  comprension: 'Comprensión lectora',
  analisis: 'Análisis',
  reflexion: 'Reflexión',
}

/** How each subject is practised; shown as guidance in the practice hub. */
export const SUBJECT_APPROACH: Record<Category, string> = {
  Matemáticas: 'En matemáticas se aprende haciendo: resuelve los ejercicios, construye en la pizarra y explica cada paso.',
  Ciencias: 'En ciencias, aplica lo leído: calcula, observa, dibuja esquemas y propone cómo comprobarías cada idea.',
  Historia: 'En historia, ordena los hechos, identifica causas y consecuencias, y pregúntate quién cuenta la historia.',
  Literatura: 'En literatura, comprueba tu comprensión y luego interpreta: personajes, lenguaje y lo que el texto te hace pensar.',
  Tecnología: 'En tecnología, separa lo científico de lo imaginario y relaciona las ideas con los inventos de hoy.',
  Otros: 'Aplica las ideas del libro a tu vida: da ejemplos, argumenta y pon en práctica lo aprendido.',
}

export const getPracticeSet = (id: string) => PRACTICE_SETS.find((s) => s.id === id)
export const setsForBook = (bookId: string) =>
  PRACTICE_SETS.filter((s) => s.bookId === bookId).sort((a, b) => a.chapter - b.chapter)
export const setsForChapter = (bookId: string, chapter: number) =>
  PRACTICE_SETS.filter((s) => s.bookId === bookId && s.chapter === chapter)

/** Open development prompts tailored to the subject, available for any chapter. */
const FREE_PROMPTS: Record<Category, { prompt: string; guidance: string; criteria: string[]; board?: boolean }[]> = {
  Matemáticas: [
    {
      prompt: 'Enuncia con tus palabras la definición, regla o proposición más importante de esta sección.',
      guidance: 'Escríbela de forma precisa y acompáñala con un dibujo si ayuda.',
      criteria: ['Mi enunciado es preciso', 'Lo ilustré con un ejemplo o dibujo'],
      board: true,
    },
    {
      prompt: 'Inventa un ejercicio que aplique lo leído y resuélvelo paso a paso.',
      guidance: 'Usa números concretos o una construcción. Justifica cada paso con lo que dice el texto.',
      criteria: ['El ejercicio aplica lo leído', 'Lo resolví paso a paso', 'Justifiqué los pasos'],
      board: true,
    },
    {
      prompt: '¿Qué parte te costó entender? Escríbela como una pregunta concreta para tu profesor o tus compañeros.',
      guidance: 'Una buena pregunta señala exactamente el paso o la palabra que no quedó clara.',
      criteria: ['Mi pregunta es concreta'],
    },
  ],
  Ciencias: [
    {
      prompt: 'Explica la idea o el fenómeno principal de esta sección como si se lo contaras a un compañero.',
      guidance: 'Usa tus propias palabras y un esquema en la pizarra si ayuda.',
      criteria: ['Explico la idea con mis palabras', 'Mi explicación es correcta según el texto'],
      board: true,
    },
    {
      prompt: 'Relaciona lo leído con algo que puedas observar en tu vida cotidiana.',
      guidance: 'Describe qué observarías, dónde y cuándo.',
      criteria: ['Doy un ejemplo cotidiano concreto', 'Lo conecto con la idea del texto'],
    },
    {
      prompt: 'Plantea una pregunta que podrías investigar a partir de esta sección y cómo la comprobarías.',
      guidance: 'Piensa en qué medirías, qué compararías y qué resultado esperarías.',
      criteria: ['Mi pregunta se puede investigar', 'Propongo un método para comprobarla'],
    },
  ],
  Historia: [
    {
      prompt: 'Resume los hechos principales en orden: quién, qué, cuándo y dónde.',
      guidance: 'Puedes hacer una línea de tiempo en la pizarra.',
      criteria: ['Incluyo personajes, hechos, fechas y lugares', 'Respeto el orden de los acontecimientos'],
      board: true,
    },
    {
      prompt: '¿Qué causas y qué consecuencias identificas en lo que acabas de leer?',
      guidance: 'Separa causas (por qué ocurrió) de consecuencias (qué provocó).',
      criteria: ['Nombro al menos una causa', 'Nombro al menos una consecuencia'],
    },
    {
      prompt: '¿Desde qué punto de vista está contada esta historia? ¿Qué voces faltan?',
      guidance: 'Piensa en quién escribe, cuándo y para quién.',
      criteria: ['Identifico el punto de vista del autor', 'Propongo una voz que falta'],
    },
  ],
  Literatura: [
    {
      prompt: 'Resume con tus palabras lo que ocurre en esta sección (5 a 6 líneas).',
      guidance: 'Incluye inicio, conflicto y cómo queda la situación.',
      criteria: ['Mi resumen es fiel al texto', 'Uso mis propias palabras'],
    },
    {
      prompt: 'Elige un personaje: ¿cómo es, qué quiere y cómo cambia? Apóyate en una cita.',
      guidance: 'Copia una frase breve del texto que muestre su carácter.',
      criteria: ['Describo al personaje', 'Incluyo una cita del texto'],
    },
    {
      prompt: 'Copia una frase que te haya llamado la atención y explica qué significa y por qué es valiosa.',
      guidance: 'Fíjate en el lenguaje: comparaciones, imágenes, ironía, ritmo.',
      criteria: ['Explico el significado', 'Comento un recurso del lenguaje'],
    },
  ],
  Tecnología: [
    {
      prompt: '¿Qué idea científica o técnica aparece en esta sección? Explícala.',
      guidance: 'Si ayuda, dibuja un esquema del invento o del fenómeno.',
      criteria: ['Identifico la idea técnica', 'La explico con claridad'],
      board: true,
    },
    {
      prompt: '¿Qué es real y qué es ficción en lo que leíste? ¿Cómo lo sabes?',
      guidance: 'Compara con lo que sabe la ciencia actual.',
      criteria: ['Distingo lo real de lo imaginario', 'Justifico con conocimiento actual'],
    },
    {
      prompt: '¿Qué tecnología actual se relaciona con esta sección y qué dilemas plantea?',
      guidance: 'Piensa en beneficios, riesgos y responsabilidad.',
      criteria: ['Relaciono con una tecnología actual', 'Planteo un dilema'],
    },
  ],
  Otros: [
    {
      prompt: '¿Cuál es la idea central de esta sección? Escríbela en una o dos frases.',
      guidance: 'Evita copiar: reformula.',
      criteria: ['La idea central es correcta', 'Está en mis palabras'],
    },
    {
      prompt: 'Aplica esa idea a una situación real de tu vida o de tu entorno.',
      guidance: 'Describe la situación y qué harías distinto gracias a lo leído.',
      criteria: ['Describo una situación concreta', 'Aplico la idea del texto'],
    },
    {
      prompt: '¿Estás de acuerdo con el autor? Argumenta con al menos una razón.',
      guidance: 'Toma posición y apóyala en un argumento o ejemplo.',
      criteria: ['Tomo posición', 'La argumento'],
    },
  ],
}

export const freeSetId = (bookId: string, chapter: number) => `libre-${bookId}-${chapter}`

/** A development-only practice for any chapter, tailored to the book's subject. */
export function freeSet(book: Book, chapter: number): PracticeSet {
  const c = book.chapters[chapter]
  return {
    id: freeSetId(book.id, chapter),
    bookId: book.id,
    chapter,
    title: `Práctica libre: ${c?.title ?? 'capítulo'}`,
    kind: 'reflexion',
    description: 'Preguntas de desarrollo para consolidar lo que acabas de leer. Escribe, dibuja y luego autoevalúate.',
    questions: FREE_PROMPTS[book.category].map((p, i) => ({
      id: `libre${i + 1}`,
      kind: 'open' as const,
      prompt: p.prompt,
      guidance: p.guidance,
      criteria: p.criteria,
      board: p.board,
      minWords: 25,
    })),
  }
}

export function resolveSet(book: Book, id: string): PracticeSet | undefined {
  const m = id.match(/^libre-(.+)-(\d+)$/)
  if (m && m[1] === book.id) return freeSet(book, Number(m[2]))
  const set = getPracticeSet(id)
  return set?.bookId === book.id ? set : undefined
}

// ——— Grading

/** Accepts Spanish and English number formats: "1.720.000", "382,5", "0.7", "1 667". */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace(/[\s  ]/g, '')
  if (!s) return null
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const clean = (s: string) =>
  normalize(s)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** Score for an auto-graded answer (1 or 0), or for an open answer (its self-assessment). */
export function scoreAnswer(q: Question, value: AnswerValue): number {
  switch (q.kind) {
    case 'choice':
      return value === q.answer ? 1 : 0
    case 'truefalse':
      return value === q.answer ? 1 : 0
    case 'numeric': {
      const n = typeof value === 'string' ? parseNumber(value) : typeof value === 'number' ? value : null
      if (n === null) return 0
      return Math.abs(n - q.answer) <= (q.tolerance ?? 1e-9) ? 1 : 0
    }
    case 'short':
      return typeof value === 'string' && q.accepted.some((a) => clean(a) === clean(value)) ? 1 : 0
    case 'order':
      return Array.isArray(value) && value.length === q.items.length && value.every((v, i) => v === q.items[i]) ? 1 : 0
    case 'open':
      return typeof value === 'number' ? value : 0
  }
}

/** Deterministic shuffle that never returns the solved order (for "order" questions). */
export function scramble(items: string[], seed: string) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) | 0
    const j = Math.abs(h) % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  if (out.every((v, i) => v === items[i])) out.push(out.shift()!)
  return out
}
