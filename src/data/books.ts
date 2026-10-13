import type { Book, BookInfo, Category, CoverStyle } from '../types'
import { LIBRARY } from './library.generated'

export const CATEGORIES: Category[] = [
  'Ciencias',
  'Matemáticas',
  'Historia',
  'Literatura',
  'Filosofía',
  'Ciudadanía',
  'Tecnología',
  'Otros',
]

/** Free, legal e-book lending for readers in Chile, used for works still under copyright. */
const BPD = 'https://www.bpdigital.cl/'

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

  // ——— 4° medio: material de estudio escrito para la app (content/*.md)
  {
    id: 'matematica-4-medio',
    title: 'Matemática 4° medio: teoría y práctica',
    author: 'Biblioteca Educativa',
    category: 'Matemáticas',
    subject: 'Plan común de 4° medio',
    description:
      'Matemática financiera, probabilidades (binomial y normal), funciones potencia y funciones trigonométricas, con ejemplos resueltos y 40 ejercicios.',
    synopsis:
      'Un libro de estudio para 4° medio organizado en cuatro unidades. Cada una parte de una situación real —pedir un crédito, responder una prueba al azar, alejarse de un parlante, subir a una rueda de la fortuna—, explica la idea con palabras simples, la formaliza y la resuelve paso a paso. Al final de cada unidad hay una práctica de 10 ejercicios con corrección inmediata y explicación.',
    rating: 4.7,
    ratingsCount: 214,
    language: 'Español',
    year: 2026,
    edition: 'Material de estudio original',
    popularity: 90,
    premium: false,
    cover: { ...covers.slate, pattern: 'grid' },
    tags: ['4° medio', 'matemática financiera', 'probabilidad', 'funciones', 'trigonometría', 'PAES'],
    levels: ['4° medio'],
    original: true,
  },
  {
    id: 'lengua-4-medio',
    title: 'Lengua y Literatura 4° medio: leer para pensar el mundo',
    author: 'Biblioteca Educativa',
    category: 'Literatura',
    subject: 'Plan común de 4° medio',
    description:
      'Interpretación literaria, narradores, utopías y distopías, argumentación y lectura crítica de medios, con lecturas recomendadas de la biblioteca.',
    synopsis:
      'Herramientas para leer de forma crítica: cómo sostener una interpretación con evidencia del texto, qué cambia según quién narra, cómo las utopías y distopías critican su propio presente, cómo construir un argumento y reconocer falacias, y cómo verificar la información antes de compartirla. Cada capítulo remite a obras de la biblioteca para practicar.',
    rating: 4.6,
    ratingsCount: 168,
    language: 'Español',
    year: 2026,
    edition: 'Material de estudio original',
    popularity: 84,
    premium: false,
    cover: { ...covers.clay, pattern: 'lines' },
    tags: ['4° medio', 'interpretación', 'distopía', 'argumentación', 'falacias', 'medios'],
    levels: ['4° medio'],
    original: true,
  },
  {
    id: 'filosofia-4-medio',
    title: 'Filosofía: preguntas para pensar',
    author: 'Biblioteca Educativa',
    category: 'Filosofía',
    subject: 'Filosofía 3° y 4° medio',
    description:
      'Qué es filosofar, el problema del conocimiento, las grandes teorías éticas y la filosofía política, explicadas con ejemplos y dilemas.',
    synopsis:
      'Desde Sócrates y la alegoría de la caverna hasta Rawls y el velo de ignorancia: este libro presenta las preguntas centrales de la filosofía —qué podemos saber, cómo debemos actuar, qué hace justa a una sociedad— y las conecta con obras reales de la biblioteca, como «Que nada se sabe», «El contrato social» y «Antígona».',
    rating: 4.6,
    ratingsCount: 121,
    language: 'Español',
    year: 2026,
    edition: 'Material de estudio original',
    popularity: 78,
    premium: false,
    cover: { ...covers.ink, pattern: 'arcs' },
    tags: ['4° medio', 'ética', 'conocimiento', 'Sócrates', 'Kant', 'contrato social'],
    levels: ['4° medio'],
    original: true,
  },
  {
    id: 'educacion-ciudadana-4-medio',
    title: 'Educación Ciudadana 4° medio',
    author: 'Biblioteca Educativa',
    category: 'Ciudadanía',
    subject: 'Plan común de 4° medio',
    description: 'Democracia, Estado de derecho, la institucionalidad chilena, derechos humanos y participación.',
    synopsis:
      'Qué significa ser ciudadano y cómo funciona la democracia en Chile: la Constitución, la separación de poderes, cómo se hace una ley, la Declaración Universal de los Derechos Humanos y las formas de participar en el bien común. Incluye los desafíos actuales de la democracia, como la desinformación y la desconfianza en las instituciones.',
    rating: 4.5,
    ratingsCount: 97,
    language: 'Español',
    year: 2026,
    edition: 'Material de estudio original',
    popularity: 74,
    premium: false,
    cover: { ...covers.forest, pattern: 'grid' },
    tags: ['4° medio', 'democracia', 'Constitución', 'derechos humanos', 'participación', 'Chile'],
    levels: ['4° medio'],
    original: true,
  },
  {
    id: 'ciencias-ciudadania-4-medio',
    title: 'Ciencias para la Ciudadanía 4° medio',
    author: 'Biblioteca Educativa',
    category: 'Ciencias',
    subject: 'Plan común de 4° medio',
    description:
      'Salud, prevención de riesgos y sismos, cambio climático y energía, y tecnología y sociedad: ciencia para tomar decisiones.',
    synopsis:
      'Los cuatro módulos de la asignatura en un solo libro: bienestar y salud (alimentación, vacunas, antibióticos, salud mental); seguridad y autocuidado (por qué tiembla en Chile y cómo prepararse); ambiente y sostenibilidad (efecto invernadero, consumo de energía, economía circular); y tecnología y sociedad (datos personales, algoritmos e inteligencia artificial).',
    rating: 4.5,
    ratingsCount: 88,
    language: 'Español',
    year: 2026,
    edition: 'Material de estudio original',
    popularity: 72,
    premium: false,
    cover: { ...covers.olive, pattern: 'waves' },
    tags: ['4° medio', 'salud', 'sismos', 'cambio climático', 'energía', 'inteligencia artificial'],
    levels: ['4° medio'],
    original: true,
  },
  {
    id: 'fahrenheit-451-guia',
    title: 'Fahrenheit 451 · Guía de lectura',
    author: 'Biblioteca Educativa · sobre la novela de Ray Bradbury',
    category: 'Literatura',
    subject: 'Distopía',
    description:
      'Contexto, argumento, personajes, temas y símbolos de la novela de Ray Bradbury, con 10 ejercicios para después de leerla.',
    synopsis:
      'En el mundo de «Fahrenheit 451», los bomberos no apagan incendios: queman libros. Esta guía acompaña la lectura de la novela de Ray Bradbury (1953): explica su contexto en la Guerra Fría, resume sus tres partes, analiza a Montag, Clarisse, Mildred, Beatty y Faber, y propone claves para entender la censura, el entretenimiento y la memoria. La novela tiene derechos de autor vigentes: puedes pedirla gratis en préstamo digital.',
    rating: 4.8,
    ratingsCount: 412,
    language: 'Español',
    year: 2026,
    edition: 'Guía de lectura original',
    popularity: 93,
    premium: false,
    cover: { ...covers.ochre, pattern: 'waves' },
    tags: ['4° medio', 'distopía', 'censura', 'Bradbury', 'libros', 'ciencia ficción'],
    levels: ['4° medio'],
    original: true,
    access: {
      label: 'Pedir la novela en la Biblioteca Pública Digital',
      url: BPD,
      note: '«Fahrenheit 451» tiene derechos de autor vigentes, por eso aquí encontrarás la guía y la práctica, no la novela. Puedes leerla gratis por préstamo digital en la Biblioteca Pública Digital de Chile o pedirla en la biblioteca de tu colegio o comuna.',
    },
  },
  {
    id: '1984-guia',
    title: '1984 · Guía de lectura',
    author: 'Biblioteca Educativa · sobre la novela de George Orwell',
    category: 'Literatura',
    subject: 'Distopía',
    description:
      'Contexto, argumento, personajes y conceptos clave —Gran Hermano, neolengua, doblepensar— de la novela de Orwell, con 10 ejercicios.',
    synopsis:
      'Winston Smith trabaja reescribiendo el pasado en el Ministerio de la Verdad, bajo la mirada constante del Gran Hermano. Esta guía acompaña la lectura de «1984» (1949): presenta a Orwell y su experiencia con la propaganda, resume las tres partes de la novela, analiza a Winston, Julia y O’Brien, y explica los conceptos que la novela le dio al mundo. La novela completa está en esta biblioteca, en traducción propia.',
    rating: 4.8,
    ratingsCount: 437,
    language: 'Español',
    year: 2026,
    edition: 'Guía de lectura original',
    popularity: 90,
    premium: false,
    cover: { ...covers.ink, pattern: 'grid' },
    tags: ['4° medio', 'distopía', 'vigilancia', 'Orwell', 'totalitarismo', 'neolengua'],
    levels: ['4° medio'],
    original: true,
  },
  {
    id: '1984',
    title: '1984',
    author: 'George Orwell',
    category: 'Literatura',
    subject: 'Distopía',
    description:
      'Winston Smith reescribe el pasado para el Partido hasta que se atreve a pensar por sí mismo. La novela que inventó al Gran Hermano.',
    synopsis:
      'En Oceanía, el Partido vigila a todos a través de telepantallas, reescribe la historia cada día y prepara un idioma, la neolengua, en el que será imposible pensar contra él. Winston Smith, funcionario del Ministerio de la Verdad, empieza un diario secreto, se enamora de Julia y busca a la Hermandad que lucharía contra el Gran Hermano. Publicada en 1949, es la gran advertencia del siglo veinte sobre la vigilancia, la propaganda y la manipulación de la verdad. Orwell murió en 1950, por lo que en Chile la obra es de dominio público desde 2021; esta es una traducción nueva hecha para Biblioteca Educativa a partir del original en inglés.',
    rating: 4.9,
    ratingsCount: 1526,
    language: 'Español',
    year: 1949,
    edition: 'Traducción de Biblioteca Educativa (2026)',
    rights: 'Dominio público en Chile · traducción propia',
    popularity: 97,
    premium: false,
    cover: { ...covers.ink, pattern: 'lines' },
    tags: ['4° medio', 'distopía', 'Orwell', 'Gran Hermano', 'vigilancia', 'neolengua', 'totalitarismo'],
    levels: ['4° medio'],
  },

  // ——— Literatura que enseña a mirar el mundo de otra forma
  {
    id: 'el-proceso',
    title: 'El proceso',
    author: 'Franz Kafka',
    category: 'Literatura',
    subject: 'Novela del siglo XX',
    description:
      'Josef K. es detenido una mañana sin saber de qué se le acusa. Una novela sobre el poder anónimo de la burocracia.',
    synopsis:
      'El día en que cumple treinta años, el empleado bancario Josef K. es arrestado en su pensión sin que nadie le diga por qué. Puede seguir trabajando, pero queda atrapado en un proceso judicial absurdo: tribunales en buhardillas, abogados que no ayudan, funcionarios inalcanzables. Publicada en 1925, después de la muerte de Kafka, es una de las novelas que mejor retratan la angustia frente a un poder que nadie comprende. De ella viene el adjetivo «kafkiano».',
    rating: 4.6,
    ratingsCount: 892,
    language: 'Español',
    year: 1925,
    edition: 'Colección Carrascalejo de la Jara',
    popularity: 86,
    premium: false,
    cover: { ...covers.slate, pattern: 'lines' },
    tags: ['4° medio', 'Kafka', 'burocracia', 'poder', 'absurdo', 'kafkiano'],
    levels: ['4° medio'],
  },
  {
    id: 'niebla',
    title: 'Niebla',
    author: 'Miguel de Unamuno',
    category: 'Literatura',
    subject: 'Novela (nivola)',
    description:
      'Augusto Pérez se enamora, duda, sufre… y termina discutiendo con su propio autor si tiene derecho a decidir su destino.',
    synopsis:
      'Augusto Pérez es un joven rico y desocupado que vive «como en una niebla» hasta que se enamora de Eugenia, una profesora de piano. La historia de ese amor, contada con humor y diálogos filosóficos, da un giro asombroso cuando Augusto decide visitar en Salamanca a su autor, Miguel de Unamuno, para discutir su propia existencia. Unamuno llamó a esta obra «nivola» para marcar su distancia con la novela tradicional.',
    rating: 4.6,
    ratingsCount: 734,
    language: 'Español',
    year: 1914,
    edition: 'Texto completo con prólogo y epílogo',
    popularity: 82,
    premium: false,
    cover: { ...covers.mist, pattern: 'waves' },
    tags: ['4° medio', 'Unamuno', 'existencia', 'metaficción', 'libertad', 'nivola'],
    levels: ['4° medio'],
  },
  {
    id: 'tragedias-sofocles',
    title: 'Edipo rey · Edipo en Colono · Antígona',
    author: 'Sófocles',
    category: 'Literatura',
    subject: 'Tragedia griega',
    description:
      'Las tres tragedias tebanas: el rey que busca la verdad sobre sí mismo y la joven que desafía la ley del tirano.',
    synopsis:
      'Edipo, rey de Tebas, investiga la causa de la peste que azota su ciudad y descubre que él mismo es el culpable que busca. En «Edipo en Colono» lo acompañamos, ciego y desterrado, hasta su muerte. En «Antígona», su hija desafía la orden del rey Creonte y entierra a su hermano, enfrentando la ley de la ciudad con la de su conciencia. Escritas en el siglo V a. C., siguen siendo una referencia para pensar el destino, la responsabilidad y la desobediencia.',
    rating: 4.7,
    ratingsCount: 965,
    language: 'Español',
    year: -429,
    edition: 'Traducción de José Pérez Bojart',
    popularity: 85,
    premium: false,
    cover: { ...covers.sand, pattern: 'arcs' },
    tags: ['4° medio', 'tragedia', 'Grecia', 'destino', 'desobediencia', 'teatro'],
    levels: ['4° medio'],
  },
  {
    id: 'candido',
    title: 'Cándido, o el optimismo',
    author: 'Voltaire',
    category: 'Literatura',
    subject: 'Sátira filosófica',
    description:
      'Una sátira feroz contra quienes justifican cualquier desgracia diciendo que vivimos «en el mejor de los mundos posibles».',
    synopsis:
      'Cándido es expulsado del castillo donde su maestro Pangloss le enseñaba que todo ocurre para bien. Desde entonces recorre el mundo —guerras, terremotos, la Inquisición, la esclavitud, el país de El Dorado— y cada desgracia pone a prueba esa filosofía. Publicada en 1759, la novela se ríe del optimismo ingenuo y termina con un consejo práctico: hay que cultivar nuestro huerto.',
    rating: 4.5,
    ratingsCount: 618,
    language: 'Español',
    year: 1759,
    edition: 'Traducción española antigua (ortografía original)',
    popularity: 76,
    premium: false,
    cover: { ...covers.ochre, pattern: 'dots' },
    tags: ['Voltaire', 'Ilustración', 'sátira', 'optimismo', 'filosofía', 'viajes'],
  },
  {
    id: 'doctor-jekyll',
    title: 'El extraño caso del doctor Jekyll y míster Hyde',
    author: 'Robert Louis Stevenson',
    category: 'Literatura',
    subject: 'Novela de misterio',
    description:
      'Un respetado médico y un hombre brutal que parecen no tener nada en común. Un clásico sobre el bien y el mal dentro de cada persona.',
    synopsis:
      'El abogado Utterson investiga la extraña relación entre su amigo, el prestigioso doctor Jekyll, y el violento señor Hyde, que parece tener poder sobre él. El misterio se resuelve en las confesiones finales del doctor Lanyon y del propio Jekyll. Publicada en 1886, es una reflexión sobre la doble naturaleza humana, la ciencia sin límites y las apariencias de la sociedad victoriana.',
    rating: 4.6,
    ratingsCount: 1043,
    language: 'Español',
    year: 1886,
    edition: 'Traducción española antigua',
    popularity: 83,
    premium: false,
    cover: { ...covers.ink, pattern: 'waves' },
    tags: ['Stevenson', 'misterio', 'doble', 'bien y mal', 'ciencia', 'Londres'],
  },
  {
    id: 'sub-terra',
    title: 'Sub terra',
    author: 'Baldomero Lillo',
    category: 'Literatura',
    subject: 'Cuento chileno',
    description:
      'Cuentos sobre la vida de los mineros del carbón en Lota. Incluye «La compuerta número 12» y «El Chiflón del Diablo».',
    synopsis:
      'Baldomero Lillo conoció de cerca el trabajo en las minas de carbón de Lota y Coronel. En estos ocho cuentos, publicados en 1904, retrata la dureza de la vida bajo tierra: niños que trabajan en la oscuridad, accidentes, salarios que no alcanzan y la indiferencia de los dueños. Es una de las obras fundamentales del realismo social chileno y una denuncia que sigue vigente.',
    rating: 4.7,
    ratingsCount: 1190,
    language: 'Español',
    year: 1904,
    edition: 'Primera edición (ortografía original)',
    popularity: 88,
    premium: false,
    cover: { ...covers.ink, pattern: 'dots' },
    tags: ['4° medio', 'Chile', 'minería', 'Lota', 'realismo', 'trabajo infantil'],
    levels: ['4° medio'],
  },

  // ——— Filosofía
  {
    id: 'utopia',
    title: 'Utopía',
    author: 'Tomás Moro',
    category: 'Filosofía',
    subject: 'Filosofía política',
    description:
      'La isla imaginaria que dio nombre a todas las sociedades ideales, y una crítica a la desigualdad de la Inglaterra del siglo XVI.',
    synopsis:
      'En el Libro primero, el viajero Rafael Hitlodeo critica la injusticia de Europa: el castigo de los pobres, la ambición de los reyes, la propiedad concentrada en pocas manos. En el Libro segundo describe la isla de Utopía, donde no existe la propiedad privada, todos trabajan seis horas, hay tolerancia religiosa y las autoridades se eligen. Publicada en 1516, inventó un género y una palabra.',
    rating: 4.4,
    ratingsCount: 576,
    language: 'Español',
    year: 1516,
    edition: 'Traducción española (Wikisource)',
    popularity: 73,
    premium: false,
    cover: { ...covers.cream, pattern: 'grid' },
    tags: ['4° medio', 'utopía', 'sociedad ideal', 'propiedad', 'Renacimiento', 'política'],
    levels: ['4° medio'],
  },
  {
    id: 'ariel',
    title: 'Ariel',
    author: 'José Enrique Rodó',
    category: 'Filosofía',
    subject: 'Ensayo latinoamericano',
    description:
      'Un maestro se despide de sus alumnos con un llamado a la juventud de América Latina: cultivar el espíritu frente al utilitarismo.',
    synopsis:
      'El viejo maestro Próspero reúne por última vez a sus discípulos junto a una estatua de Ariel, el espíritu del aire de «La tempestad» de Shakespeare. Les habla de la juventud, del ocio creador, de la belleza, de la democracia y de los riesgos de imitar sin crítica el utilitarismo de Estados Unidos. Publicado en 1900, fue uno de los ensayos más leídos por varias generaciones de jóvenes latinoamericanos.',
    rating: 4.3,
    ratingsCount: 402,
    language: 'Español',
    year: 1900,
    edition: 'Editorial Cervantes, 1920',
    popularity: 66,
    premium: false,
    cover: { ...covers.mist, pattern: 'arcs' },
    tags: ['Rodó', 'juventud', 'América Latina', 'ensayo', 'idealismo', 'Uruguay'],
  },
  {
    id: 'el-hombre-mediocre',
    title: 'El hombre mediocre',
    author: 'José Ingenieros',
    category: 'Filosofía',
    subject: 'Ensayo de psicología y moral',
    description:
      'Idealistas contra rutinarios: un ensayo apasionado sobre la mediocridad, la envidia, el mérito y los ideales.',
    synopsis:
      'El médico y filósofo argentino José Ingenieros contrapone dos tipos humanos: el idealista, que se propone metas de perfección y está dispuesto a ir contra la corriente, y el hombre mediocre, que solo imita, obedece la rutina y desconfía de quien se destaca. Publicado en 1913, fue un libro de cabecera para la juventud latinoamericana y sigue provocando discusión.',
    rating: 4.4,
    ratingsCount: 688,
    language: 'Español',
    year: 1913,
    edition: 'Editorial Renacimiento, 1913',
    popularity: 75,
    premium: false,
    cover: { ...covers.olive, pattern: 'lines' },
    tags: ['Ingenieros', 'idealismo', 'mediocridad', 'juventud', 'ética', 'Argentina'],
  },
  {
    id: 'que-nada-se-sabe',
    title: 'Que nada se sabe',
    author: 'Francisco Sánchez',
    category: 'Filosofía',
    subject: 'Teoría del conocimiento',
    description:
      'Un médico del siglo XVI pone en duda todo el saber de su época y propone un único camino: la experiencia y el juicio crítico.',
    synopsis:
      'Publicado en 1581, este tratado del médico y filósofo Francisco Sánchez ataca la ciencia de su tiempo, hecha de silogismos, definiciones y autoridades indiscutidas. Su duda radical —«ni esto siquiera sé, que nada sé»— no es un punto final, sino un método: el que quiera saber algo debe observar las cosas mismas. Incluye un prólogo de Marcelino Menéndez y Pelayo.',
    rating: 4.2,
    ratingsCount: 214,
    language: 'Español',
    year: 1581,
    edition: 'Con prólogo de Menéndez y Pelayo',
    popularity: 58,
    premium: false,
    cover: { ...covers.sage, pattern: 'dots' },
    tags: ['4° medio', 'escepticismo', 'conocimiento', 'ciencia', 'método', 'Renacimiento'],
    levels: ['4° medio'],
  },

  // ——— Ciencias
  {
    id: 'naturaleza-de-las-cosas',
    title: 'De la naturaleza de las cosas',
    author: 'Tito Lucrecio Caro',
    category: 'Ciencias',
    subject: 'Atomismo antiguo',
    description:
      'Hace dos mil años, un poeta romano explicó el universo con átomos y vacío, sin intervención de los dioses.',
    synopsis:
      'En seis libros, Lucrecio expone la física de Epicuro: todo está hecho de átomos invisibles que se mueven en el vacío; nada nace de la nada ni se reduce a la nada. Con esas ideas explica el alma, los sentidos, el origen del mundo y de la vida, el rayo y los terremotos, para liberar a las personas del miedo a los dioses y a la muerte. Esta versión en prosa permite leer sin dificultad una obra que inspiró a científicos durante siglos.',
    rating: 4.3,
    ratingsCount: 271,
    language: 'Español',
    year: -55,
    edition: 'Versión en prosa de Manuel Rodríguez-Navas',
    popularity: 60,
    premium: true,
    cover: { ...covers.forest, pattern: 'dots' },
    tags: ['átomos', 'física', 'Epicuro', 'Roma', 'filosofía natural', 'historia de la ciencia'],
  },

  // ——— Ciudadanía
  {
    id: 'el-contrato-social',
    title: 'El contrato social',
    author: 'Jean-Jacques Rousseau',
    category: 'Ciudadanía',
    subject: 'Filosofía política',
    description:
      '«El hombre ha nacido libre» y, sin embargo, vive encadenado. La obra que fundó la idea moderna de soberanía popular.',
    synopsis:
      'Rousseau se pregunta qué puede hacer legítimo el poder. Su respuesta es un pacto en que cada persona se une a todas las demás y solo obedece a la voluntad general, es decir, al interés común de los ciudadanos. Publicado en 1762, inspiró la Revolución francesa y los movimientos de independencia de América. Esta traducción de 1819 conserva la ortografía de la época.',
    rating: 4.4,
    ratingsCount: 503,
    language: 'Español',
    year: 1762,
    edition: 'Traducción española de 1819',
    popularity: 70,
    premium: false,
    cover: { ...covers.clay, pattern: 'grid' },
    tags: ['4° medio', 'Rousseau', 'soberanía', 'voluntad general', 'democracia', 'Ilustración'],
    levels: ['4° medio'],
  },
  {
    id: 'igualdad-social-politica',
    title: 'La igualdad social y política',
    author: 'Concepción Arenal',
    category: 'Ciudadanía',
    subject: 'Pensamiento social',
    description:
      '¿Qué desigualdades son injustas y cómo se perpetúan? Un ensayo pionero de una de las grandes pensadoras del siglo XIX.',
    synopsis:
      'Concepción Arenal, jurista y reformadora social española, analiza el origen de la desigualdad, cómo se perpetúa la injusta y cuál es su relación con la libertad, la propiedad y la democracia. Escrito en 1862 y revisado en 1876, se publicó en sus obras completas. Su pregunta central —si la igualdad ante la ley basta para que haya justicia— sigue abierta.',
    rating: 4.2,
    ratingsCount: 146,
    language: 'Español',
    year: 1898,
    edition: 'Obras completas, Librería de Victoriano Suárez',
    popularity: 54,
    premium: true,
    cover: { ...covers.sage, pattern: 'arcs' },
    tags: ['igualdad', 'libertad', 'justicia social', 'mujeres pensadoras', 'democracia', 'siglo XIX'],
  },
  {
    id: 'moral-social',
    title: 'Moral social',
    author: 'Eugenio María de Hostos',
    category: 'Ciudadanía',
    subject: 'Ética y sociedad',
    description:
      'Los deberes que nos unen con la sociedad, explicados por el gran educador puertorriqueño que también enseñó en Chile.',
    synopsis:
      'Eugenio María de Hostos, educador y pensador puertorriqueño que vivió y enseñó en Chile, escribió este tratado para sus alumnos. Explica las relaciones que nos ligan con la sociedad —de necesidad, gratitud, utilidad, derecho y deber— y luego aplica la moral a la política, la escuela, la ciencia, el arte, el periodismo y la industria.',
    rating: 4.1,
    ratingsCount: 118,
    language: 'Español',
    year: 1888,
    edition: 'Texto completo de la obra',
    popularity: 50,
    premium: true,
    cover: { ...covers.olive, pattern: 'grid' },
    tags: ['Hostos', 'ética', 'deberes', 'sociedad', 'educación', 'América Latina'],
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
