export type Category = 'Ciencias' | 'Matemáticas' | 'Historia' | 'Literatura' | 'Tecnología' | 'Otros'

export interface Chapter {
  title: string
  paragraphs: string[]
  /** Audio duration in seconds for the audiobook track of this chapter. */
  audioSeconds: number
}

export interface CoverStyle {
  bg: string
  fg: string
  accent: string
  pattern: 'lines' | 'dots' | 'arcs' | 'grid' | 'waves'
}

export interface Book {
  id: string
  title: string
  author: string
  category: Category
  subject: string
  description: string
  synopsis: string
  rating: number
  ratingsCount: number
  pages: number
  language: string
  publishedAt: string // ISO date
  publisher: string
  isbn: string
  popularity: number
  premium: boolean
  hasAudio: boolean
  sizeMB: number
  cover: CoverStyle
  tags: string[]
  chapters: Chapter[]
}

export type PlanId = 'free' | 'monthly' | 'annual'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  avatarColor: string
  avatarDataUrl?: string
  plan: PlanId
  createdAt: string
  provider: 'email' | 'google'
}

export type TaskStatus = 'pendiente' | 'en-progreso' | 'completada'
export type TaskPriority = 'alta' | 'media' | 'baja'

export interface Task {
  id: string
  title: string
  subject: string
  description: string
  dueDate: string // ISO date
  priority: TaskPriority
  progress: number
  status: TaskStatus
  bookId?: string
}

export interface Download {
  bookId: string
  downloadedAt: string
  sizeMB: number
}

export interface ReadingProgress {
  bookId: string
  page: number
  totalPages: number
  chapter: number
  percent: number
  updatedAt: string
  bookmarks: number[]
}

export interface AudioProgress {
  bookId: string
  track: number
  position: number
  updatedAt: string
}

export interface Plan {
  id: PlanId
  name: string
  price: number
  period: 'mes' | 'año' | null
  description: string
  features: { label: string; included: boolean }[]
  recommended?: boolean
  /** Placeholder for a future Stripe Price ID. */
  stripePriceId?: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  createdAt: string
  read: boolean
  kind: 'download' | 'recommendation' | 'task' | 'system'
  link?: string
}

export type ThemeMode = 'light' | 'dark' | 'auto'

export interface Preferences {
  theme: ThemeMode
  language: 'es' | 'en'
  readerFontSize: number
  readerLineHeight: number
  /** null = follow the app theme */
  readerDark: boolean | null
  notifyTasks: boolean
  notifyRecommendations: boolean
  notifyDownloads: boolean
  shareActivity: boolean
  personalizedRecommendations: boolean
  audioVolume: number
  audioRate: number
}
