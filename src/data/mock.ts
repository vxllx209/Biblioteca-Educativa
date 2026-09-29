import type { AppNotification, Plan, Preferences, ReadingProgress, Task, User } from '../types'

const daysFromNow = (d: number) => {
  const date = new Date()
  date.setDate(date.getDate() + d)
  return date.toISOString()
}

/** Demo account available on first run. */
export const DEMO_USER: User = {
  id: 'u-javier',
  firstName: 'Javier',
  lastName: 'Morales',
  email: 'javier@biblioteca.edu',
  password: 'demo1234',
  role: 'Estudiante',
  avatarColor: '#4F806D',
  plan: 'free',
  createdAt: '2025-03-01T10:00:00.000Z',
  provider: 'email',
}

export const USERS: User[] = [DEMO_USER]

export const TASKS: Task[] = [
  {
    id: 't-ensayo-revolucion',
    title: 'Ensayo de la Revolución',
    subject: 'Historia',
    description:
      'Leer el capítulo IV de «Facundo» («Revolución de 1810») y escribir un ensayo de 1.200 palabras sobre cómo Sarmiento interpreta la revolución y sus consecuencias en el campo y la ciudad.',
    dueDate: daysFromNow(2),
    priority: 'alta',
    progress: 45,
    status: 'en-progreso',
    bookId: 'facundo',
    practiceSetId: 'facundo-revolucion',
  },
  {
    id: 't-geometria',
    title: 'Ejercicios de Geometría: definiciones de Euclides',
    subject: 'Matemáticas',
    description:
      'Leer las definiciones, postulados y axiomas del Libro I de los «Elementos». Dibujar un ejemplo de cada definición y reproducir la demostración de la Proposición I (triángulo equilátero).',
    dueDate: daysFromNow(4),
    priority: 'media',
    progress: 0,
    status: 'pendiente',
    bookId: 'elementos-de-euclides',
    practiceSetId: 'euclides-proposiciones',
  },
  {
    id: 't-lab-ciencias',
    title: 'Reporte de Laboratorio de Ciencias',
    subject: 'Ciencias',
    description:
      'Redactar el informe de la práctica de observación del cielo nocturno. Usar los capítulos «La Luna» y «Las estaciones» de «Cosmografía» como marco teórico.',
    dueDate: daysFromNow(7),
    priority: 'media',
    progress: 20,
    status: 'en-progreso',
    bookId: 'cosmografia',
    practiceSetId: 'cosmo-luna',
  },
  {
    id: 't-lectura-cap4',
    title: 'Lectura Capítulo 4',
    subject: 'Lenguaje',
    description: 'Leer el capítulo IV de «Marianela» («La familia de piedra») y responder las preguntas de comprensión.',
    dueDate: daysFromNow(-1),
    priority: 'baja',
    progress: 100,
    status: 'completada',
    bookId: 'marianela',
    practiceSetId: 'marianela-piedra',
  },
  {
    id: 't-comentario-poesia',
    title: 'Comentario de texto: Martín Fierro',
    subject: 'Lenguaje',
    description: 'Analizar el Canto I de «El gaucho Martín Fierro»: métrica, habla gauchesca, figuras retóricas y tema central.',
    dueDate: daysFromNow(10),
    priority: 'baja',
    progress: 0,
    status: 'pendiente',
    bookId: 'martin-fierro',
    practiceSetId: 'fierro-canto1',
  },
]

export const FAVORITES: string[] = ['don-quijote', 'reglas-investigacion-cientifica', 'la-edad-de-oro']

export const READING_PROGRESS: ReadingProgress[] = [
  {
    bookId: 'marianela',
    chapter: 3,
    position: 0.4,
    percent: 17,
    updatedAt: daysFromNow(0),
    bookmarks: [],
  },
  {
    bookId: 'don-quijote',
    chapter: 2,
    position: 0.5,
    percent: 1,
    updatedAt: daysFromNow(-1),
    bookmarks: [],
  },
  {
    bookId: 'facundo',
    chapter: 7,
    position: 0.2,
    percent: 27,
    updatedAt: daysFromNow(-2),
    bookmarks: [],
  },
]

/** Currency is configurable; prices are expressed in this currency. */
export const CURRENCY = { code: 'USD', locale: 'en-US', symbol: '$' }

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratis',
    price: 0,
    period: null,
    description: 'Para comenzar a explorar la biblioteca.',
    features: [
      { label: 'Acceso a libros gratuitos', included: true },
      { label: 'Favoritos ilimitados', included: true },
      { label: 'Hasta 3 descargas', included: true },
      { label: 'Vista previa de audiolibros', included: true },
      { label: 'Audiolibros completos', included: false },
      { label: 'Contenido premium', included: false },
      { label: 'Lectura sin límites', included: false },
    ],
  },
  {
    id: 'monthly',
    name: 'Mensual',
    price: 9.99,
    period: 'mes',
    description: 'Flexibilidad total, cancela cuando quieras.',
    stripePriceId: 'price_monthly_placeholder',
    features: [
      { label: 'Acceso a todos los libros', included: true },
      { label: 'Favoritos ilimitados', included: true },
      { label: 'Descargas ilimitadas', included: true },
      { label: 'Audiolibros completos', included: true },
      { label: 'Contenido premium', included: true },
      { label: 'Lectura sin límites', included: true },
    ],
  },
  {
    id: 'annual',
    name: 'Anual',
    price: 99.99,
    period: 'año',
    description: 'Ahorra más de 16% frente al plan mensual.',
    recommended: true,
    stripePriceId: 'price_annual_placeholder',
    features: [
      { label: 'Acceso a todos los libros', included: true },
      { label: 'Favoritos ilimitados', included: true },
      { label: 'Descargas ilimitadas', included: true },
      { label: 'Audiolibros completos', included: true },
      { label: 'Contenido premium', included: true },
      { label: 'Lectura sin límites', included: true },
    ],
  },
]

export const FREE_DOWNLOAD_LIMIT = 3

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-task',
    title: 'Tienes una tarea próxima a vencer',
    body: '“Ensayo de la Revolución” vence en 2 días.',
    createdAt: daysFromNow(0),
    read: false,
    kind: 'task',
    link: '/tasks',
  },
  {
    id: 'n-reco',
    title: 'Nuevo libro recomendado',
    body: 'Te podría interesar «Reglas y consejos sobre investigación científica», de Ramón y Cajal.',
    createdAt: daysFromNow(-1),
    read: false,
    kind: 'recommendation',
    link: '/book/reglas-investigacion-cientifica',
  },
  {
    id: 'n-audio',
    title: 'Nuevos audiolibros',
    body: '10 libros ya tienen narración completa. Pruébalos con «Marianela».',
    createdAt: daysFromNow(-3),
    read: true,
    kind: 'system',
    link: '/audio/marianela',
  },
]

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  language: 'es',
  readerFontSize: 18,
  readerLineHeight: 1.8,
  readerFont: 'serif',
  readerDark: null,
  readerAnimations: true,
  notifyTasks: true,
  notifyRecommendations: true,
  notifyDownloads: true,
  shareActivity: false,
  personalizedRecommendations: true,
  audioVolume: 0.8,
  audioRate: 1,
}
