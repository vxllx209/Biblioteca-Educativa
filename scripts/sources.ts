/**
 * Where each book's real content comes from.
 *  - Text: Project Gutenberg (public domain) or Spanish Wikisource.
 *  - Audio: LibriVox recordings hosted on archive.org (public domain).
 *
 * `chapter` tells the extractor what starts a chapter:
 *   - a heading tag ('h2', 'h3'…), or
 *   - a regex matched against short paragraphs (for books without heading markup).
 */
export interface Source {
  id: string
  gutenberg?: number[]
  wikisource?: {
    pages: string[]
    /** Chapter titles, one per page (defaults to the last part of the page name). */
    titles?: string[]
    /** Page linked as the source (defaults to the first page's root). */
    index?: string
  }
  /** Original study material written for the app, in content/ (see build-library.ts). */
  local?: string
  chapter: { tag?: string; regex?: string; heading?: string }
  /** Headings (regex, case-insensitive) that start sections to drop, e.g. tables of contents. */
  dropSections?: string
  /** Keep only chapters whose index is within this range (after extraction). */
  slice?: [number, number?]
  /** Keep only chapters whose title matches (regex, case-insensitive). */
  only?: string
  /** Cut the book where a chapter labelled with this part (regex) begins, e.g. a second work in the same file. */
  stopAtPart?: string
  /** Source lines are verse: keep the raw line breaks inside paragraphs. */
  verse?: boolean
  /** Text between a part heading and its first chapter becomes a chapter of its own (introductions). */
  introChapters?: boolean
  /** Regex for the first paragraph to keep, dropping the publisher's front matter before it. */
  startAt?: string
  /** Regex for a heading printed inside the text; the line after it becomes the chapter subtitle. */
  subtitleAfter?: string
  /** Drop chapters shorter than this many characters (e.g. lists of contents between parts). */
  minChars?: number
  /** Regex for the paragraph where the work ends; it and everything after is dropped. */
  endAt?: string
  /** Regex (case-sensitive) for paragraphs to drop anywhere, e.g. repeated ALL-CAPS titles. */
  dropBlocks?: string
  librivox?: string
  /** Keep only the LibriVox tracks whose title matches (regex), e.g. one play of an anthology. */
  librivoxTracks?: string
}

const CONTRATO_SOCIAL = (
  [
    ['I', 9],
    ['II', 12],
    ['III', 18],
    ['IV', 9],
  ] as const
).flatMap(([book, n]) =>
  Array.from({ length: n }, (_, i) => `El contrato social (1819)/Libro ${book} - Capítulo ${roman(i + 1)}`),
)

function roman(n: number) {
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [v, r] of map) while (n >= v) (out += r), (n -= v)
  return out
}

const LILLO = [
  'Los inválidos (Lillo)',
  'La compuerta número 12',
  'El grisú',
  'El pago',
  'El Chiflón del Diablo',
  'El pozo (Lillo)',
  'Juan Fariña',
  'Caza mayor',
]

const UTOPIA = [
  'Libro primero',
  'Introducción',
  'Las ciudades y en particular Amaurota',
  'Los magistrados',
  'Las artes y los oficios',
  'Las relaciones públicas entre los utopianos',
  'Los viajes de los utopianos',
  'Los esclavos',
  'El arte de la guerra',
  'Religiones de los utopianos',
]

export const SOURCES: Source[] = [
  // Ciencias
  { id: 'reglas-investigacion-cientifica', gutenberg: [66373], chapter: { tag: 'h2' } },
  { id: 'recuerdos-de-mi-vida', gutenberg: [58331], chapter: { tag: 'h2' }, librivox: 'recuerdosdemivida_2406_librivox' },
  { id: 'cosmografia', gutenberg: [20930], chapter: { tag: 'h2' } },
  // Matemáticas
  {
    id: 'elementos-de-euclides',
    wikisource: {
      // Only the fully proofread parts of the 1774 edition are included.
      pages: ['Prólogo', 'Libro I'].map(
        (n) => `Los seis primeros libros, y el undecimo, y duodecimo de los elementos de Euclides/${n}`,
      ),
    },
    chapter: {},
  },
  // Historia
  {
    id: 'conquista-nueva-espana',
    gutenberg: [64945, 64946, 64947],
    chapter: { tag: 'h2' },
    librivox: 'historiaverdaderadelaconquista_1711_librivox',
  },
  { id: 'historia-herodoto', gutenberg: [72753], chapter: { tag: 'h2' }, only: 'prólogo del traductor|libro primero', librivox: 'historia_herodoto_i_1109_librivox' },
  { id: 'facundo', gutenberg: [33267], chapter: { tag: 'h3' } },
  // Literatura
  { id: 'don-quijote', gutenberg: [2000], chapter: { tag: 'h3' }, slice: [4], librivox: 'donquijote_2507_librivox' },
  { id: 'lazarillo-de-tormes', gutenberg: [320], chapter: { tag: 'h2' } },
  { id: 'marianela', gutenberg: [17340], chapter: { tag: 'h2' }, librivox: 'marianela_2104_librivox' },
  { id: 'cuentos-quiroga', gutenberg: [13507], chapter: { tag: 'h1' }, librivox: 'cuentosquiroga_1312_librivox' },
  { id: 'martin-fierro', gutenberg: [14765], chapter: { regex: '^[IVXL]+(\\.| ?-) ' }, verse: true, librivox: 'martinfierro_1402_librivox' },
  // Tecnología
  { id: 'las-fuerzas-extranas', gutenberg: [65689], chapter: { tag: 'h2' }, librivox: 'lasfuerzasextranas_1707_librivox' },
  { id: 'el-anacronopete', gutenberg: [62359], chapter: { tag: 'h3' }, stopAtPart: 'viaje a china', librivox: 'el_anacronopete_1912_librivox' },
  // Otros
  { id: 'el-criterio', gutenberg: [28929], chapter: { tag: 'h2' }, slice: [1], librivox: 'criterio_2408_librivox' },
  { id: 'la-edad-de-oro', gutenberg: [19898], chapter: { tag: 'h2' }, librivox: 'edad_de_oro_1001_librivox' },
  { id: 'amor-y-pedagogia', gutenberg: [49149], chapter: { tag: 'h2' }, librivox: 'amor_2411_librivox' },

  // ——— Literatura que enseña a mirar el mundo de otra forma
  { id: 'el-proceso', gutenberg: [77334], chapter: { tag: 'h2' } },
  { id: 'niebla', gutenberg: [49836], chapter: { tag: 'h2' }, librivox: 'niebla_1701_librivox' },
  {
    id: 'tragedias-sofocles',
    gutenberg: [63509],
    chapter: { tag: 'h3' },
    librivox: 'tragediassofocles_1606_librivox',
    librivoxTracks: 'edipo|ant[ií]gona',
  },
  // The source marks a few chapters with the wrong heading level, so match them by text.
  { id: 'candido', gutenberg: [7109], chapter: { heading: '^cap[ií]tulo' }, endAt: '^tabla$', librivox: 'candido_2604_librivox' },
  {
    id: 'doctor-jekyll',
    gutenberg: [62627],
    chapter: { tag: 'h2' },
    dropSections: '^(sumario|sobre la presente obra)',
    librivox: 'extranocaso_doctorjekyll_senorhyde_1803_librivox',
  },
  {
    id: 'sub-terra',
    wikisource: { pages: LILLO, titles: LILLO.map((p) => p.replace(' (Lillo)', '')), index: 'Sub terra (1904)' },
    chapter: {},
    dropBlocks: '^[A-ZÁÉÍÓÚÑ0-9 .,]{3,}$',
  },
  // ——— Filosofía
  {
    id: 'utopia',
    wikisource: { pages: UTOPIA.map((p) => `Utopía: ${p}`), titles: UTOPIA.map((p, i) => (i === 1 ? 'Libro segundo: Introducción' : p)), index: 'Utopía' },
    chapter: {},
  },
  { id: 'ariel', gutenberg: [22899], chapter: { tag: 'h1' }, startAt: '^Aquella tarde', dropSections: '^josé enrique rodó$' },
  { id: 'el-hombre-mediocre', gutenberg: [64974], chapter: { tag: 'h3' }, introChapters: true, minChars: 1000 },
  { id: 'que-nada-se-sabe', gutenberg: [65937], chapter: { tag: 'h2' } },
  // ——— Ciencias
  // The translation prints the first Latin words of each passage ("1. Æneadum genitrix...").
  { id: 'naturaleza-de-las-cosas', gutenberg: [62711], chapter: { tag: 'h2' }, dropBlocks: String.raw`^\d+\. .{0,80}\.\.\.$` },
  // ——— Educación Ciudadana
  {
    id: 'el-contrato-social',
    wikisource: {
      pages: CONTRATO_SOCIAL,
      titles: CONTRATO_SOCIAL.map((p) => p.split('/')[1].replace(' - ', ' · ')),
      index: 'El contrato social (1819)',
    },
    chapter: {},
    subtitleAfter: '^C A P I T U L O',
    dropBlocks: String.raw`^(EL CONTRATO|SOCIAL,|ó|PRINCIPIOS|DEL DERECHO POLÍTICO\.)$`,
  },
  // The last "chapter" is the publisher's catalogue.
  { id: 'igualdad-social-politica', gutenberg: [52502], chapter: { tag: 'h3' }, introChapters: true, slice: [0, -1] },
  // ——— Material de estudio de 4° medio, escrito para la app (content/*.md)
  { id: 'matematica-4-medio', local: 'content/matematica-4-medio.md', chapter: {} },
  { id: 'lengua-4-medio', local: 'content/lengua-4-medio.md', chapter: {} },
  { id: 'filosofia-4-medio', local: 'content/filosofia-4-medio.md', chapter: {} },
  { id: 'educacion-ciudadana-4-medio', local: 'content/educacion-ciudadana-4-medio.md', chapter: {} },
  { id: 'ciencias-ciudadania-4-medio', local: 'content/ciencias-ciudadania-4-medio.md', chapter: {} },
  // Guías de lectura de obras con derechos vigentes: no reproducen el texto.
  { id: 'fahrenheit-451-guia', local: 'content/fahrenheit-451-guia.md', chapter: {} },
  { id: '1984-guia', local: 'content/1984-guia.md', chapter: {} },
  // 1984 (Orwell murió en 1950: dominio público en Chile desde 2021). Traducción propia desde el original en inglés.
  { id: '1984', local: 'content/1984', chapter: {} },
  // Starts at Hostos' own prologue (the edition opens with a long biographical essay by another author).
  { id: 'moral-social', gutenberg: [73064], chapter: { tag: 'h3' }, introChapters: true, slice: [10] },
]
