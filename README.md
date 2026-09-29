# Biblioteca Educativa

Plataforma web para estudiantes: descubrir, leer, escuchar y descargar libros educativos, gestionar tareas, favoritos, perfil y planes Premium.

**Stack:** React 19 + TypeScript + Tailwind CSS v4 + React Router 7 + lucide-react (Vite).

```bash
bun install
bun run dev        # http://localhost:5173
bun run build      # typecheck + build de producción
```

Cuenta de demostración: `javier@biblioteca.edu` / `demo1234` (o “Continuar con Google”, simulado).

## Estructura

```
src/
  data/        books.ts (catálogo + capítulos), mock.ts (usuarios, tareas, planes, notificaciones, preferencias)
  context/     Auth, Library (favoritos, descargas, progreso, tareas, notificaciones), Audio, Preferences (tema), Toast
  components/  BookCard, BookGrid, SearchBar, Sidebar, BottomNavigation, TaskCard, AudioPlayer, MiniPlayer,
               ProgressBar, ProfileCard, PremiumPlan, ReaderControls, NotificationPanel, Modal, Toast, …
  pages/       Welcome, Login, Register, ForgotPassword, Home, Explore, BookDetail, Reader, Tasks,
               Favorites, Downloads, Profile, ProfileEdit, Premium, AudioPage
  services/    payments.ts — preparado para Stripe (define VITE_PAYMENTS_URL con un backend de checkout)
```

## Notas

- Sin backend: sesión, usuarios, favoritos, progreso de lectura, tareas, descargas, tema y preferencias se guardan en `localStorage` (prefijo `be:`), por usuario.
- Los pagos, las descargas y el audio de los audiolibros son simulados. El lector usa la síntesis de voz del navegador para “Leer en voz alta”.
- Las portadas se generan con SVG; la app no depende de recursos externos (la fuente Inter se incluye vía `@fontsource/inter`).
- Responsive: barra lateral completa ≥1200px, barra de iconos 768–1199px, navegación inferior <768px.
