export const SUBJECTS = {
  matematicas: {
    nombre: 'Matemáticas',
    icon: 'fa-calculator',
    color: '#0057FF',
    dark: '#0041C4',
    light: '#5C8DFF',
    bgTint: '#EEF3FF',
  },
  lenguaje: {
    nombre: 'Lenguaje',
    icon: 'fa-book',
    color: '#D62828',
    dark: '#A81E1E',
    light: '#FF7A7A',
    bgTint: '#FFF1F1',
  },
  historia: {
    nombre: 'Historia',
    icon: 'fa-landmark',
    color: '#F2B705',
    dark: '#C79A04',
    light: '#FFDE70',
    bgTint: '#FFFBE6',
  },
  ciencias: {
    nombre: 'Ciencias',
    icon: 'fa-flask',
    color: '#10B981',
    dark: '#0C8F63',
    light: '#5EEAB5',
    bgTint: '#ECFDF5',
  },
  ingles: {
    nombre: 'Inglés',
    icon: 'fa-language',
    color: '#7C3AED',
    dark: '#5F27C9',
    light: '#B794F6',
    bgTint: '#F5F0FF',
  },
}

export const SUBJECT_KEYS = Object.keys(SUBJECTS)

export function nombreDesdeEmail(email) {
  if (!email) return 'Usuario'
  const local = email.split('@')[0]
  const limpio = local.replace(/[._-\d]+/g, ' ').trim()
  if (!limpio) return local
  return limpio
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function inicialesDe(nombre) {
  const partes = nombre.trim().split(' ').filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}
