# Biblioteca Educativa

Plataforma web para estudiantes: descubrir, leer, escuchar y descargar libros educativos, gestionar tareas, favoritos, perfil y planes Premium.

**Stack:** React 19 + TypeScript + Tailwind CSS v4 + React Router 7 + lucide-react (Vite).

```bash
bun install
bun run dev        # http://localhost:5173
bun run build      # typecheck + build de producción (incluye soporte sin conexión)
bun run preview    # sirve el build de producción
```

Configura Supabase (ver [Backend](#backend-supabase)); sin él, la cuenta de demostración local es `javier@biblioteca.edu` / `demo1234`.

## Material real

La biblioteca contiene **17 obras reales de dominio público** en español (≈ 2,3 millones de palabras):

| Categoría | Obras |
| --- | --- |
| Ciencias | *Reglas y consejos sobre investigación científica* y *Recuerdos de mi vida* (Ramón y Cajal), *Cosmografía* (Guillemin) |
| Matemáticas | *Elementos de Euclides* (ed. española de 1774, fragmento del Libro I) |
| Historia | *Historia verdadera de la conquista de la Nueva España* (Bernal Díaz), *Historia, Libro I* (Heródoto), *Facundo* (Sarmiento) |
| Literatura | *Don Quijote*, *Lazarillo de Tormes*, *Marianela*, *Cuentos de amor de locura y de muerte*, *Martín Fierro* |
| Tecnología | *El anacronópete* (Gaspar), *Las fuerzas extrañas* (Lugones) |
| Otros | *El criterio* (Balmes), *La Edad de Oro* (Martí), *Amor y pedagogía* (Unamuno) |

- **Textos:** Project Gutenberg y Wikisource, convertidos a capítulos en `public/books/<id>.json`.
- **Audiolibros:** 10 obras tienen narración humana completa de **LibriVox** (voluntarios, dominio público), transmitida desde archive.org. Si un servidor falla, el reproductor prueba automáticamente otra copia.
- Para regenerar el contenido: `bun scripts/build-library.ts` (fuentes y reglas en `scripts/sources.ts`).

## Práctica: aplicar lo leído

Cada materia se practica distinto, así que después de leer hay **34 prácticas guiadas (175 preguntas)** escritas a partir de los capítulos reales:

- **Matemáticas y Ciencias:** ejercicios de aplicación con respuesta numérica, construcciones en una **pizarra** (lápiz, recta, compás, borrador) y explicaciones paso a paso. Ej.: clasificar figuras con las definiciones de Euclides, construir la Proposición I, medir la Tierra como Fernel.
- **Historia y Literatura:** comprensión (alternativas, verdadero/falso, respuesta corta, ordenar hechos) y análisis con **espacio de desarrollo**.
- **Tecnología y Otros:** distinguir ciencia de ficción, aplicar el pensamiento crítico a situaciones reales.

Las preguntas cerradas se corrigen al instante con explicación; las abiertas muestran una respuesta modelo, criterios y una autoevaluación. Además, cualquier capítulo tiene una **práctica libre** de desarrollo adaptada a su materia. El lector invita a practicar al terminar un capítulo, las tareas enlazan a su práctica y los resultados se guardan.

Las prácticas están en `src/data/practice/`; valida que coincidan con el contenido con `bun scripts/check-practice.ts`.

## Funciones clave

- **Lector:** paginación real por columnas (se adapta a la pantalla, tamaño y tipo de letra), animación 3D de pasar página, índice, marcadores, búsqueda con resaltado, modo oscuro, lectura en voz alta (voz del navegador) que avanza las páginas sola. Guarda capítulo, posición y porcentaje.
- **Audio:** reproductor completo + mini-player persistente, ±10 s, pistas, velocidad, volumen, controles del sistema (Media Session). Se restaura tras recargar.
- **Descargas reales:** el texto se guarda en Cache Storage y un service worker permite abrir la app y leer los libros descargados sin conexión (en `build`/`preview`, no en `dev`).
- **Premium:** los libros Premium permiten leer los 2 primeros capítulos y escuchar la primera pista; los pagos están preparados para Stripe en `src/services/payments.ts` (define `VITE_PAYMENTS_URL`).

## Backend: Supabase

El proyecto se conecta a Supabase (`orlnrwjvxuetpupcsept`) para cuentas y datos:

1. Copia `.env.example` a `.env.local` y pega la **anon / publishable key** (Project Settings → API).
2. Ejecuta `supabase/migrations/20261006000000_init.sql` en el SQL Editor del panel (o `supabase db push`). Crea:
   - `profiles`: nombre, avatar, plan… (se crea sola al registrarse, con RLS).
   - `user_state`: favoritos, progreso, marcadores, tareas, prácticas, notificaciones y audio de cada usuario, con RLS.
3. En Authentication → URL Configuration agrega `http://localhost:5173/**` (y tu dominio) a *Redirect URLs*. Para Google, activa el proveedor en Authentication → Providers.

- **Auth real:** correo/contraseña, Google (OAuth), confirmación por correo, recuperación de contraseña (`/reset-password`) y cambio de correo.
- **Sincronización:** los datos se guardan al instante en `localStorage` y se replican a Supabase; al entrar desde otro dispositivo se recuperan. Las descargas sin conexión y las preferencias de visualización quedan en cada dispositivo.
- **Sin variables de entorno** la app funciona en modo local (todo en `localStorage`, con la cuenta demo `javier@biblioteca.edu` / `demo1234`).
- El cobro de planes sigue simulado: el plan se actualiza desde el cliente. Al conectar Stripe, revoca la escritura de `profiles.plan` y fíjalo desde un webhook.
