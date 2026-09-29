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
  wikisource?: { pages: string[] }
  chapter: { tag?: string; regex?: string }
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
  librivox?: string
}

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
]
