/** Validates the practice sets against the real book content: bun scripts/check-practice.ts */
import { BOOKS } from '../src/data/books'
import { PRACTICE_SETS, parseNumber, scoreAnswer } from '../src/data/practice'

let errors = 0
const fail = (msg: string) => {
  errors++
  console.error('✗', msg)
}
const ids = new Set<string>()
for (const set of PRACTICE_SETS) {
  const book = BOOKS.find((b) => b.id === set.bookId)
  if (!book) fail(`${set.id}: libro inexistente ${set.bookId}`)
  else if (!book.chapters[set.chapter]) fail(`${set.id}: capítulo ${set.chapter} fuera de rango`)
  if (ids.has(set.id)) fail(`${set.id}: id duplicado`)
  ids.add(set.id)
  const qids = new Set<string>()
  for (const q of set.questions) {
    if (qids.has(q.id)) fail(`${set.id}/${q.id}: id de pregunta duplicado`)
    qids.add(q.id)
    if (q.kind === 'choice' && !(q.answer >= 0 && q.answer < q.options.length)) fail(`${set.id}/${q.id}: respuesta fuera de rango`)
    if (q.kind === 'order' && q.items.length < 3) fail(`${set.id}/${q.id}: pocos elementos para ordenar`)
    // The correct answer must grade as correct.
    const ok =
      q.kind === 'choice' ? scoreAnswer(q, q.answer)
      : q.kind === 'truefalse' ? scoreAnswer(q, q.answer)
      : q.kind === 'numeric' ? scoreAnswer(q, String(q.answer).replace('.', ','))
      : q.kind === 'short' ? scoreAnswer(q, q.accepted[0].toUpperCase())
      : q.kind === 'order' ? scoreAnswer(q, q.items)
      : 1
    if (ok !== 1) fail(`${set.id}/${q.id}: la respuesta correcta no se califica como correcta`)
  }
  console.log(`✓ ${set.id.padEnd(28)} ${book?.chapters[set.chapter]?.title.slice(0, 40).padEnd(42)} ${set.questions.length} preguntas`)
}
for (const [raw, n] of [['1.720.000', 1720000], ['382,5', 382.5], ['0.7', 0.7], ['1 667', 1667], ['14', 14]] as const)
  if (parseNumber(raw) !== n) fail(`parseNumber(${raw}) = ${parseNumber(raw)}`)
console.log(`\n${PRACTICE_SETS.length} prácticas, ${PRACTICE_SETS.reduce((s, x) => s + x.questions.length, 0)} preguntas, ${errors} errores`)
process.exit(errors ? 1 : 0)
