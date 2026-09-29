import type { AppNotification, Download, Plan, Preferences, ReadingProgress, Task, User } from '../types'

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
      'Redactar un ensayo de 1.200 palabras sobre las causas de la Revolución Francesa y su influencia en las independencias latinoamericanas. Incluir al menos tres fuentes.',
    dueDate: daysFromNow(2),
    priority: 'alta',
    progress: 45,
    status: 'en-progreso',
    bookId: 'historia-de-la-revolucion',
  },
  {
    id: 't-calculo',
    title: 'Ejercicios de Cálculo Diferencial',
    subject: 'Matemáticas',
    description: 'Resolver los ejercicios 1 al 20 de la guía de derivadas, aplicando regla de la cadena y derivación implícita.',
    dueDate: daysFromNow(4),
    priority: 'media',
    progress: 0,
    status: 'pendiente',
    bookId: 'calculo-diferencial',
  },
  {
    id: 't-lab-biologia',
    title: 'Reporte de Laboratorio de Biología',
    subject: 'Biología',
    description: 'Elaborar el informe de la práctica de observación de células vegetales y animales al microscopio.',
    dueDate: daysFromNow(7),
    priority: 'media',
    progress: 20,
    status: 'en-progreso',
    bookId: 'biologia-celular-moderna',
  },
  {
    id: 't-lectura-cap4',
    title: 'Lectura Capítulo 4',
    subject: 'Biología',
    description: 'Leer el capítulo 4 “Núcleo, ADN y división celular” y responder las preguntas de comprensión.',
    dueDate: daysFromNow(-1),
    priority: 'baja',
    progress: 100,
    status: 'completada',
    bookId: 'biologia-celular-moderna',
  },
  {
    id: 't-comentario-poesia',
    title: 'Comentario de texto poético',
    subject: 'Lenguaje',
    description: 'Analizar un poema a elección identificando figuras retóricas, ritmo y tema central.',
    dueDate: daysFromNow(10),
    priority: 'baja',
    progress: 0,
    status: 'pendiente',
    bookId: 'principios-de-literatura',
  },
]

export const FAVORITES: string[] = ['biologia-celular-moderna', 'desarrollo-cognitivo', 'introduccion-programacion']

export const DOWNLOADS: Download[] = [
  { bookId: 'biologia-celular-moderna', downloadedAt: daysFromNow(-3), sizeMB: 18.4 },
  { bookId: 'principios-de-literatura', downloadedAt: daysFromNow(-9), sizeMB: 10.8 },
]

export const READING_PROGRESS: ReadingProgress[] = [
  {
    bookId: 'biologia-celular-moderna',
    page: 2,
    totalPages: 8,
    chapter: 1,
    percent: 38,
    updatedAt: daysFromNow(0),
    bookmarks: [],
  },
  {
    bookId: 'calculo-diferencial',
    page: 1,
    totalPages: 6,
    chapter: 0,
    percent: 33,
    updatedAt: daysFromNow(-1),
    bookmarks: [],
  },
  {
    bookId: 'historia-de-la-revolucion',
    page: 3,
    totalPages: 6,
    chapter: 1,
    percent: 67,
    updatedAt: daysFromNow(-2),
    bookmarks: [2],
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
    body: 'Te podría interesar “Ecología y Sostenibilidad”.',
    createdAt: daysFromNow(-1),
    read: false,
    kind: 'recommendation',
    link: '/book/ecologia-sostenibilidad',
  },
  {
    id: 'n-download',
    title: 'Tu descarga terminó',
    body: '“Biología Celular Moderna” está disponible sin conexión.',
    createdAt: daysFromNow(-3),
    read: true,
    kind: 'download',
    link: '/downloads',
  },
]

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  language: 'es',
  readerFontSize: 18,
  readerLineHeight: 1.8,
  readerDark: null,
  notifyTasks: true,
  notifyRecommendations: true,
  notifyDownloads: true,
  shareActivity: false,
  personalizedRecommendations: true,
  audioVolume: 0.8,
  audioRate: 1,
}
