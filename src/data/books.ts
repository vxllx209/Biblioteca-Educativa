import type { Book, BookInfo, Category, CoverStyle } from '../types'
import { LIBRARY } from './library.generated'

export const CATEGORIES: Category[] = ['Ciencias', 'Matemáticas', 'Historia', 'Literatura', 'Tecnología', 'Otros']

const covers = {
  forest: { bg: '#285B4A', fg: '#F3F6F4', accent: '#DCEBE4', pattern: 'arcs' },
  sage: { bg: '#4F806D', fg: '#FFFFFF', accent: '#DCEBE4', pattern: 'lines' },
  sand: { bg: '#E9DFC9', fg: '#2E3834', accent: '#C18A45', pattern: 'dots' },
  clay: { bg: '#9C6450', fg: '#FBF4EF', accent: '#E8C9B8', pattern: 'waves' },
  slate: { bg: '#3F5560', fg: '#F1F4F5', accent: '#BCCDD3', pattern: 'grid' },
  ink: { bg: '#24302B', fg: '#EEF5F1', accent: '#8FB5A4', pattern: 'lines' },
  olive: { bg: '#6B7448', fg: '#FAFAF2', accent: '#DDE2C2', pattern: 'dots' },
  mist: { bg: '#DCEBE4', fg: '#214A3C', accent: '#4F806D', pattern: 'grid' },
  ochre: { bg: '#C18A45', fg: '#FFFBF4', accent: '#F4E2C6', pattern: 'arcs' },
  cream: { bg: '#F2EEE4', fg: '#285B4A', accent: '#4F806D', pattern: 'waves' },
} satisfies Record<string, CoverStyle>

/**
 * Real public-domain works. Texts come from Project Gutenberg and Wikisource; recordings from
 * LibriVox. Run `bun scripts/build-library.ts` to regenerate the content files.
 */
const INFO: BookInfo[] = [
  // ——— Ciencias
  {
    id: 'reglas-investigacion-cientifica',
    title: 'Reglas y consejos sobre investigación científica',
    author: 'Santiago Ramón y Cajal',
    category: 'Ciencias',
    subject: 'Método científico',
    description:
      'El Premio Nobel de Medicina explica cómo se forma un investigador: la curiosidad, la disciplina, la observación y la voluntad.',
    synopsis:
      'Conocido también como «Los tónicos de la voluntad», este libro nació de un discurso que Cajal pronunció en 1897 ante la Real Academia de Ciencias. Con un tono cercano y lleno de ejemplos, desmonta los prejuicios que frenan al principiante —creer que todo está descubierto, que se necesita un talento excepcional— y describe las cualidades morales, los conocimientos y el método que exige la ciencia. Sigue siendo una lectura recomendada para cualquier estudiante que quiera investigar.',
    rating: 4.8,
    ratingsCount: 1284,
    language: 'Español',
    year: 1897,
    edition: 'Edición ampliada (6.ª ed.)',
    popularity: 92,
    premium: false,
    cover: covers.forest,
    tags: ['investigación', 'ciencia', 'método', 'Cajal', 'voluntad'],
  },
  {
    id: 'recuerdos-de-mi-vida',
    title: 'Recuerdos de mi vida',
    author: 'Santiago Ramón y Cajal',
    category: 'Ciencias',
    subject: 'Biografía científica',
    description:
      'La infancia y juventud del padre de la neurociencia, contadas por él mismo con humor y sinceridad.',
    synopsis:
      'En este primer tomo, «Mi infancia y juventud», Cajal recuerda su niñez rebelde en los pueblos de Aragón, sus travesuras, su pasión por el dibujo, su formación como médico y su experiencia como médico militar en la guerra de Cuba. Es el retrato de cómo un niño difícil llegó a convertirse en uno de los científicos más importantes de la historia.',
    rating: 4.7,
    ratingsCount: 846,
    language: 'Español',
    year: 1901,
    edition: 'Tomo I: Mi infancia y juventud',
    popularity: 80,
    premium: true,
    cover: covers.sage,
    tags: ['autobiografía', 'medicina', 'neurociencia', 'Cajal', 'Cuba'],
  },
  {
    id: 'cosmografia',
    title: 'Cosmografía',
    author: 'Amédée Guillemin',
    category: 'Ciencias',
    subject: 'Astronomía',
    description:
      'Un manual escolar clásico de astronomía: la forma de la Tierra, las estaciones, los eclipses, los planetas y las estrellas.',
    synopsis:
      'Escrito para la «Enciclopedia de las escuelas», este manual explica con claridad y en pocas páginas los fenómenos del cielo que observamos a diario: por qué hay día y noche, cómo se miden las dimensiones de la Tierra, qué causa las estaciones y los eclipses, y qué sabemos del Sol, los planetas, los cometas y las estrellas. Ideal como primera aproximación a la astronomía.',
    rating: 4.4,
    ratingsCount: 392,
    language: 'Español',
    year: 1889,
    edition: 'Enciclopedia de las escuelas, Hachette',
    popularity: 70,
    premium: false,
    cover: { ...covers.slate, pattern: 'arcs' },
    tags: ['astronomía', 'Tierra', 'Luna', 'planetas', 'eclipses', 'estaciones'],
  },
  // ——— Matemáticas
  {
    id: 'elementos-de-euclides',
    title: 'Elementos de Euclides',
    author: 'Euclides',
    category: 'Matemáticas',
    subject: 'Geometría',
    description:
      'Las definiciones, postulados, axiomas y primeras proposiciones del Libro I: la base de la geometría durante más de dos mil años.',
    synopsis:
      'Los «Elementos» son el libro de matemáticas más influyente de la historia. Esta edición española de 1774, basada en la versión de Robert Simson, incluye su prólogo sobre la autoría de la obra y el comienzo del Libro I: las definiciones de punto, línea, ángulo y figura, los postulados, los axiomas y las primeras proposiciones con sus demostraciones, como la construcción de un triángulo equilátero. Se respeta la ortografía original de la época.',
    rating: 4.5,
    ratingsCount: 518,
    language: 'Español (1774)',
    year: -300,
    edition: 'Traducción española de 1774 (fragmento del Libro I)',
    popularity: 74,
    premium: false,
    cover: covers.mist,
    tags: ['geometría', 'axiomas', 'teoremas', 'Pitágoras', 'demostración'],
  },
  // ——— Historia
  {
    id: 'conquista-nueva-espana',
    title: 'Historia verdadera de la conquista de la Nueva España',
    author: 'Bernal Díaz del Castillo',
    category: 'Historia',
    subject: 'Historia de América',
    description:
      'La conquista de México narrada por un soldado que participó en ella, con una viveza que no tienen las crónicas oficiales.',
    synopsis:
      'Bernal Díaz del Castillo escribió esta crónica ya anciano, para contar «la verdad» frente a las versiones de los historiadores que no estuvieron allí. Relata las expediciones a Yucatán, la llegada de Hernán Cortés, el encuentro con Moctezuma, la caída de Tenochtitlan y los años posteriores. Una fuente fundamental —y apasionante— para estudiar el encuentro entre Europa y América.',
    rating: 4.6,
    ratingsCount: 711,
    language: 'Español',
    year: 1632,
    edition: 'Edición en tres tomos',
    popularity: 83,
    premium: true,
    cover: { ...covers.clay, pattern: 'grid' },
    tags: ['México', 'conquista', 'Cortés', 'Moctezuma', 'crónica', 'Tenochtitlan'],
  },
  {
    id: 'historia-herodoto',
    title: 'Historia · Libro I (Clío)',
    author: 'Heródoto',
    category: 'Historia',
    subject: 'Historia antigua',
    description:
      'El «padre de la Historia» narra el origen del conflicto entre griegos y persas, el reinado de Creso y el ascenso de Ciro.',
    synopsis:
      'Con Heródoto nace la historia como investigación. En este primer libro, dedicado a la musa Clío, cuenta la historia de Lidia y del rey Creso, famoso por su riqueza y por consultar al oráculo de Delfos, y el surgimiento del Imperio persa bajo Ciro el Grande. Incluye el prólogo del traductor, el padre Bartolomé Pou.',
    rating: 4.5,
    ratingsCount: 433,
    language: 'Español',
    year: -430,
    edition: 'Traducción de Bartolomé Pou',
    popularity: 66,
    premium: false,
    cover: { ...covers.sand, pattern: 'grid' },
    tags: ['Grecia', 'Persia', 'Creso', 'Ciro', 'antigüedad', 'Delfos'],
  },
  {
    id: 'facundo',
    title: 'Facundo',
    author: 'Domingo Faustino Sarmiento',
    category: 'Historia',
    subject: 'Historia de Argentina',
    description:
      '«Civilización y barbarie»: un ensayo clásico sobre la Argentina del siglo XIX a través de la vida del caudillo Facundo Quiroga.',
    synopsis:
      'Escrito en el exilio en Chile, «Facundo» mezcla biografía, ensayo sociológico y panfleto político. Sarmiento describe el paisaje de la pampa, sus tipos humanos —el rastreador, el baqueano, el gaucho cantor—, la revolución de 1810 y la vida de Juan Facundo Quiroga para explicar el caudillismo y la dictadura de Rosas. Es una obra fundamental de la literatura y el pensamiento latinoamericanos.',
    rating: 4.4,
    ratingsCount: 587,
    language: 'Español',
    year: 1845,
    edition: 'Edición con noticia preliminar',
    popularity: 75,
    premium: false,
    cover: covers.olive,
    tags: ['Argentina', 'caudillos', 'Rosas', 'pampa', 'revolución de 1810', 'civilización y barbarie'],
  },
  // ——— Literatura
  {
    id: 'don-quijote',
    title: 'Don Quijote de la Mancha',
    author: 'Miguel de Cervantes',
    category: 'Literatura',
    subject: 'Novela',
    description:
      'Las aventuras del hidalgo que enloqueció leyendo libros de caballerías y de su escudero Sancho Panza. Primera y segunda parte.',
    synopsis:
      'Alonso Quijano lee tantos libros de caballerías que decide hacerse caballero andante y salir al mundo a deshacer agravios, acompañado del labrador Sancho Panza. Entre molinos que parecen gigantes, rebaños que parecen ejércitos y un sinfín de personajes, Cervantes creó la primera novela moderna: una reflexión llena de humor sobre la realidad, la ficción y la dignidad humana.',
    rating: 4.9,
    ratingsCount: 3412,
    language: 'Español',
    year: 1605,
    edition: 'Primera y segunda parte (1605 y 1615)',
    popularity: 99,
    premium: false,
    cover: { ...covers.ink, pattern: 'waves' },
    tags: ['Cervantes', 'Sancho Panza', 'caballería', 'Siglo de Oro', 'novela'],
  },
  {
    id: 'lazarillo-de-tormes',
    title: 'Lazarillo de Tormes',
    author: 'Anónimo',
    category: 'Literatura',
    subject: 'Novela picaresca',
    description:
      'La vida de Lázaro, un niño pobre que sobrevive sirviendo a amos cada vez más peculiares. La primera novela picaresca.',
    synopsis:
      'Contada en primera persona, esta breve obra narra cómo Lázaro aprende a sobrevivir con astucia sirviendo a un ciego, a un clérigo avaro, a un escudero hambriento y a otros amos. Con ironía y humor, el autor anónimo retrata la hipocresía de la sociedad española del siglo XVI e inaugura el género picaresco.',
    rating: 4.6,
    ratingsCount: 1920,
    language: 'Español',
    year: 1554,
    edition: 'Texto completo en siete tratados',
    popularity: 90,
    premium: false,
    cover: covers.sand,
    tags: ['picaresca', 'Siglo de Oro', 'Lázaro', 'ciego', 'sátira'],
  },
  {
    id: 'marianela',
    title: 'Marianela',
    author: 'Benito Pérez Galdós',
    category: 'Literatura',
    subject: 'Novela realista',
    description:
      'Nela, una joven huérfana y humilde, sirve de lazarillo a Pablo, un muchacho ciego que la ama sin haberla visto nunca.',
    synopsis:
      'En un pueblo minero del norte de España, Marianela guía cada día a Pablo, ciego de nacimiento, que la considera la criatura más hermosa del mundo. La llegada de un médico que podría devolverle la vista pone en riesgo todo lo que ella tiene. Galdós contrapone la ciencia y el progreso a la sensibilidad y la belleza interior en una de sus novelas más emotivas.',
    rating: 4.7,
    ratingsCount: 1105,
    language: 'Español',
    year: 1878,
    edition: 'Texto completo',
    popularity: 86,
    premium: false,
    cover: covers.cream,
    tags: ['realismo', 'Galdós', 'ceguera', 'ciencia', 'amor'],
  },
  {
    id: 'cuentos-quiroga',
    title: 'Cuentos de amor de locura y de muerte',
    author: 'Horacio Quiroga',
    category: 'Literatura',
    subject: 'Cuento',
    description:
      'Relatos intensos ambientados en la selva de Misiones y en la ciudad, del gran maestro del cuento latinoamericano.',
    synopsis:
      'Esta colección reúne algunos de los cuentos más célebres de Quiroga, como «La gallina degollada», «El almohadón de pluma», «A la deriva» y «La insolación». La naturaleza implacable, la enfermedad, la locura y la muerte aparecen narradas con una precisión que convirtió a su autor en referencia obligada del género breve.',
    rating: 4.7,
    ratingsCount: 1376,
    language: 'Español',
    year: 1917,
    edition: 'Primera colección, 1917',
    popularity: 88,
    premium: false,
    cover: covers.clay,
    tags: ['cuento', 'Misiones', 'selva', 'terror', 'Uruguay', 'Argentina'],
  },
  {
    id: 'martin-fierro',
    title: 'El gaucho Martín Fierro',
    author: 'José Hernández',
    category: 'Literatura',
    subject: 'Poesía gauchesca',
    description:
      'El poema nacional argentino: la voz de un gaucho que canta sus penas, la leva a la frontera y la injusticia que lo convierte en matrero.',
    synopsis:
      '«Aquí me pongo a cantar / al compás de la vigüela…». Con estos versos comienza el poema en el que Martín Fierro relata cómo fue arrancado de su hogar para servir en los fortines de la frontera, cómo al volver lo encontró todo perdido y cómo terminó perseguido por la justicia. Escrito en el habla del campo, es una denuncia social y una joya de la poesía en español.',
    rating: 4.8,
    ratingsCount: 964,
    language: 'Español',
    year: 1872,
    edition: 'La ida, en trece cantos',
    popularity: 84,
    premium: false,
    cover: { ...covers.ochre, pattern: 'lines' },
    tags: ['gaucho', 'poesía', 'Argentina', 'pampa', 'frontera'],
  },
  // ——— Tecnología (ciencia y ficción)
  {
    id: 'el-anacronopete',
    title: 'El anacronópete',
    author: 'Enrique Gaspar',
    category: 'Tecnología',
    subject: 'Ciencia ficción',
    description:
      'Un inventor construye una máquina para viajar hacia el pasado. Una de las primeras novelas del mundo sobre una máquina del tiempo.',
    synopsis:
      'Publicada años antes que «La máquina del tiempo» de H. G. Wells, esta novela cuenta cómo el sabio zaragozano don Sindulfo García construye el anacronópete, un vehículo de hierro capaz de remontar el tiempo, y emprende con su sobrina y un grupo de viajeros un recorrido disparatado por la historia. Mezcla divulgación científica de la época con humor y crítica social.',
    rating: 4.3,
    ratingsCount: 402,
    language: 'Español',
    year: 1887,
    edition: 'Texto completo',
    popularity: 72,
    premium: true,
    cover: covers.slate,
    tags: ['viajes en el tiempo', 'máquina', 'inventos', 'ciencia ficción', 'siglo XIX'],
  },
  {
    id: 'las-fuerzas-extranas',
    title: 'Las fuerzas extrañas',
    author: 'Leopoldo Lugones',
    category: 'Tecnología',
    subject: 'Ciencia ficción',
    description:
      'Cuentos sobre científicos, experimentos e inventos que desafían las leyes de la física, más un ensayo de cosmogonía.',
    synopsis:
      'Pionero de la ciencia ficción en español, Lugones imagina aquí una fuerza capaz de desintegrar la materia, un simio al que se intenta enseñar a hablar («Yzur»), una música que se puede ver y otros experimentos inquietantes. El libro cierra con un «Ensayo de una cosmogonía en diez lecciones» sobre el origen del universo, la materia y la vida.',
    rating: 4.4,
    ratingsCount: 377,
    language: 'Español',
    year: 1906,
    edition: 'Texto completo',
    popularity: 68,
    premium: false,
    cover: covers.ink,
    tags: ['ciencia ficción', 'experimentos', 'física', 'inventos', 'cosmogonía'],
  },
  // ——— Otros
  {
    id: 'el-criterio',
    title: 'El criterio',
    author: 'Jaime Balmes',
    category: 'Otros',
    subject: 'Pensamiento crítico',
    description:
      'Un manual práctico para pensar bien: cómo prestar atención, evaluar testimonios, razonar y evitar los errores más comunes.',
    synopsis:
      '«El pensar bien consiste o en conocer la verdad o en dirigir el entendimiento por el camino que conduce a ella». Con ejemplos cotidianos, Balmes enseña a distinguir lo posible de lo real, a valorar los testimonios, a leer la historia, a no dejarse arrastrar por las pasiones y a tomar buenas decisiones. Un clásico de la lógica aplicada que sigue siendo útil para estudiar y para la vida.',
    rating: 4.6,
    ratingsCount: 628,
    language: 'Español',
    year: 1845,
    edition: 'Texto completo',
    popularity: 78,
    premium: false,
    cover: { ...covers.sage, pattern: 'dots' },
    tags: ['lógica', 'razonamiento', 'atención', 'filosofía', 'argumentación'],
  },
  {
    id: 'la-edad-de-oro',
    title: 'La Edad de Oro',
    author: 'José Martí',
    category: 'Otros',
    subject: 'Educación',
    description:
      'La revista que Martí escribió para los niños de América: historias, poemas, ciencia y héroes, para aprender y pensar.',
    synopsis:
      'En 1889 José Martí publicó cuatro números de una revista mensual «de recreo e instrucción» dedicada a los niños. Reúne artículos como «Tres héroes» (sobre Bolívar, San Martín e Hidalgo), «La Ilíada, de Homero», «La historia del hombre, contada por sus casas» o «La galería de las máquinas», además de cuentos como «Meñique», «La muñeca negra» o «Los dos ruiseñores». Una obra llena de valores y curiosidad por el mundo.',
    rating: 4.9,
    ratingsCount: 1502,
    language: 'Español',
    year: 1889,
    edition: 'Los cuatro números de la revista',
    popularity: 91,
    premium: false,
    cover: covers.ochre,
    tags: ['niños', 'Martí', 'Bolívar', 'héroes', 'poesía', 'educación'],
  },
  {
    id: 'amor-y-pedagogia',
    title: 'Amor y pedagogía',
    author: 'Miguel de Unamuno',
    category: 'Otros',
    subject: 'Pedagogía',
    description:
      'Un padre intenta criar a su hijo como un genio siguiendo un método científico. Una sátira sobre la educación.',
    synopsis:
      'Don Avito Carrascal está convencido de que la ciencia puede producir un genio, y decide educar a su hijo Apolodoro con un plan pedagógico riguroso, sin dejar lugar al azar ni al sentimiento. Unamuno convierte este experimento en una novela tragicómica que cuestiona los límites de la pedagogía y reivindica el papel del amor en la educación.',
    rating: 4.3,
    ratingsCount: 356,
    language: 'Español',
    year: 1902,
    edition: 'Texto completo con epílogo',
    popularity: 64,
    premium: true,
    cover: { ...covers.cream, pattern: 'dots' },
    tags: ['educación', 'pedagogía', 'Unamuno', 'sátira', 'crianza'],
  },
]

const WORDS_PER_PAGE = 280

export const BOOKS: Book[] = INFO.map((info) => {
  const meta = LIBRARY[info.id]
  if (!meta) throw new Error(`Falta el contenido de "${info.id}". Ejecuta: bun scripts/build-library.ts`)
  return {
    ...info,
    ...meta,
    pages: Math.max(1, Math.round(meta.words / WORDS_PER_PAGE)),
    hasAudio: !!meta.audio?.tracks.length,
    sizeMB: meta.bytes / 1_048_576,
  }
})

export const getBook = (id: string | undefined) => BOOKS.find((b) => b.id === id)

export const totalAudioSeconds = (book: Book) => book.audio?.tracks.reduce((s, t) => s + t.seconds, 0) ?? 0

/**
 * Candidate URLs for a track: the item's direct storage servers first (fast, no redirect), then
 * archive.org's redirector, which keeps working if the servers ever move.
 */
export const trackUrls = (book: Book, index: number) => {
  const t = book.audio?.tracks[index]
  if (!t) return []
  const file = encodeURIComponent(t.file)
  return [...book.audio!.mirrors.map((m) => `${m}/${file}`), `https://archive.org/download/${book.audio!.archiveId}/${file}`]
}

/** Human year: "1605", "c. 300 a. C." */
export const formatYear = (year: number) => (year < 0 ? `c. ${-year} a. C.` : String(year))

/** Characters before each chapter, for layout-independent whole-book progress. */
export function chapterOffsets(book: Book) {
  const offsets: number[] = []
  let acc = 0
  for (const c of book.chapters) {
    offsets.push(acc)
    acc += c.chars
  }
  return { offsets, total: acc }
}

export const PREVIEW_CHAPTERS = 2
