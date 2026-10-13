import { Brain, Cpu, Feather, FlaskConical, Landmark, Lightbulb, Scale, Sigma, type LucideIcon } from 'lucide-react'
import type { Category } from '../types'

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  Ciencias: FlaskConical,
  Matemáticas: Sigma,
  Historia: Landmark,
  Literatura: Feather,
  Filosofía: Brain,
  Ciudadanía: Scale,
  Tecnología: Cpu,
  Otros: Lightbulb,
}
