import { Cpu, Feather, FlaskConical, Landmark, Lightbulb, Sigma, type LucideIcon } from 'lucide-react'
import type { Category } from '../types'

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Ciencias: FlaskConical,
  Matemáticas: Sigma,
  Historia: Landmark,
  Literatura: Feather,
  Tecnología: Cpu,
  Otros: Lightbulb,
}
