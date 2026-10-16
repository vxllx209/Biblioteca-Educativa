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

La biblioteca contiene **31 obras reales de dominio público** en español, más **7 libros de estudio propios** para 4° medio:

| Categoría | Obras |
| --- | --- |
| Ciencias | *Reglas y consejos sobre investigación científica* y *Recuerdos de mi vida* (Ramón y Cajal), *Cosmografía* (Guillemin), *De la naturaleza de las cosas* (Lucrecio) |
| Matemáticas | *Elementos de Euclides* (ed. española de 1774, fragmento del Libro I) |
| Historia | *Historia verdadera de la conquista de la Nueva España* (Bernal Díaz), *Historia, Libro I* (Heródoto), *Facundo* (Sarmiento) |
| Literatura | *Don Quijote*, *Lazarillo de Tormes*, *Marianela*, *Cuentos de amor de locura y de muerte*, *Martín Fierro*, *El proceso* (Kafka), *Niebla* (Unamuno), *Edipo rey · Edipo en Colono · Antígona* (Sófocles), *Cándido* (Voltaire), *Jekyll y Hyde* (Stevenson), *Sub terra* (Lillo) |
| Filosofía | *Utopía* (Moro), *Ariel* (Rodó), *El hombre mediocre* (Ingenieros), *Que nada se sabe* (Sánchez) |
| Ciudadanía | *El contrato social* (Rousseau), *La igualdad social y política* (Arenal), *Moral social* (Hostos) |
| Tecnología | *El anacronópete* (Gaspar), *Las fuerzas extrañas* (Lugones) |
| Otros | *El criterio* (Balmes), *La Edad de Oro* (Martí), *Amor y pedagogía* (Unamuno) |

- **Textos:** Project Gutenberg y Wikisource, convertidos a capítulos en `public/books/<id>.json`.
- **Material de 4° medio (propio):** Matemática (financiera, binomial y normal, funciones potencia y trigonométricas), Lengua y Literatura, Filosofía, Educación Ciudadana y Ciencias para la Ciudadanía, escritos en `content/*.md`.
- ***1984* completa, en traducción propia** (`content/1984/`): Orwell murió en 1950, así que la obra es de dominio público en Chile desde 2021 (en EE. UU. sigue protegida hasta 2044). Las traducciones publicadas tienen derechos propios, por eso se tradujo de nuevo desde el original en inglés.
- **Guía de *Fahrenheit 451*:** la novela tiene derechos vigentes (Bradbury murió en 2012), así que la app ofrece una guía propia, 10 ejercicios y el enlace al préstamo gratuito de la Biblioteca Pública Digital.
- **Audiolibros:** 16 obras tienen narración humana completa de **LibriVox** (voluntarios, dominio público), transmitida desde archive.org. Si un servidor falla, el reproductor prueba automáticamente otra copia.
- Para regenerar el contenido: `bun scripts/build-library.ts` (fuentes y reglas en `scripts/sources.ts`).

## Práctica: aplicar lo leído

Cada materia se practica distinto, así que después de leer hay **60 prácticas guiadas (435 preguntas)**; cada libro nuevo termina con una práctica de 10 ejercicios escritas a partir de los capítulos reales:

- **Matemáticas y Ciencias:** ejercicios de aplicación con respuesta numérica, construcciones en una **pizarra** (lápiz, recta, compás, borrador) y explicaciones paso a paso. Ej.: clasificar figuras con las definiciones de Euclides, construir la Proposición I, medir la Tierra como Fernel.
- **Historia y Literatura:** comprensión (alternativas, verdadero/falso, respuesta corta, ordenar hechos) y análisis con **espacio de desarrollo**.
- **Tecnología y Otros:** distinguir ciencia de ficción, aplicar el pensamiento crítico a situaciones reales.

Las preguntas cerradas se corrigen al instante con explicación; las abiertas muestran una respuesta modelo, criterios y una autoevaluación. Además, cualquier capítulo tiene una **práctica libre** de desarrollo adaptada a su materia. El lector invita a practicar al terminar un capítulo, las tareas enlazan a su práctica y los resultados se guardan.

Las prácticas están en `src/data/practice/`; valida que coincidan con el contenido con `bun scripts/check-practice.ts`.

### Preparación PAES

La sección **Preparación PAES** (`/paes`, solo para estudiantes) reúne 40 preguntas de práctica con el formato de la PAES (4 alternativas):

- **Competencia Lectora:** 20 preguntas sobre 4 textos tomados de la biblioteca (*Lazarillo*, Martí, Ramón y Cajal y Quiroga), etiquetadas como *Localizar*, *Interpretar* o *Evaluar*. El texto se muestra junto a la pregunta, con un enlace a la obra completa.
- **Matemática M1:** 20 preguntas, 5 por eje (Números, Álgebra y funciones, Geometría, Probabilidad y estadística), cada una con la habilidad que trabaja.
- **Modos:** diagnóstico (2 preguntas por habilidad), práctica por habilidad (primero las nuevas y las falladas) y mini ensayo por prueba.
- **Mapa de habilidades:** dominio por habilidad (Inicial, Intermedio o Avanzado) a partir de la última respuesta a cada pregunta, con una recomendación de qué practicar.
- **Tutor con IA:** en las respuestas incorrectas, el botón **¿Por qué me equivoqué?** explica el error de la alternativa elegida.

No son preguntas oficiales del DEMRE. Están en `src/data/paes/` y la lógica de dominio y armado de sesiones, en `src/data/paes/index.ts`.

### Motivación

Las respuestas PAES (10 pts si es correcta, 3 si no), las prácticas terminadas (20 pts) y cada capítulo nuevo leído (15 pts) suman puntos. Con eso se calculan la **racha** de días seguidos, la **meta semanal** (configurable), el **nivel** y 8 **insignias** (`src/data/motivation.ts`). Las insignias se calculan a partir de los datos, así que nunca se desincronizan entre dispositivos. Todo se guarda en `StudyContext` y se sincroniza con Supabase como el resto del progreso (`activity.v1`, `paes.v1`).

### Panel del profesor

Cada curso abre en la pestaña **Panel** (`src/components/insights/`), calculada en `src/data/insights.ts`:

- **Resumen:** estudiantes activos en la semana, logro PAES promedio, entregas al día y promedio de notas.
- **Necesita tu atención:** estudiantes inactivos (7 días o más), en riesgo (3 a 6 días), que aún no empiezan o con tareas vencidas; la habilidad PAES más débil del curso y las entregas por revisar.
- **Gráficos:** estudiantes activos por día (últimos 14 días) y el mapa de habilidades PAES de todo el curso.
- **Las preguntas que más cuestan**, con su porcentaje de error.
- **Tabla de estudiantes** filtrable y ordenable (en celular, tarjetas) y una ficha por estudiante: racha, puntos por día, habilidades PAES, lecturas, prácticas y entregas.
- **Nota sugerida por IA:** en la revisión de entregas, **Sugerir nota con IA** propone una nota de 1,0 a 7,0 con su justificación, fortalezas y mejoras. El profesor la revisa y la guarda.

Con Supabase, el profesor lee solo el progreso de estudio (`progress.v2`, `practice.v1`, `paes.v1`, `activity.v1`) de los estudiantes de **sus** cursos, gracias a la política de `supabase/migrations/20261016000000_teacher_insights.sql`. Los favoritos, notificaciones y tareas personales siguen siendo privados. En modo local, **Mis cursos → Curso de demostración** crea un curso con 12 estudiantes y tres semanas de actividad para mostrar el panel.

### Tutor con IA

En las preguntas de desarrollo, el botón **Revisar con IA** envía la respuesta a un modelo de IA en **Groq** (por defecto `openai/gpt-oss-120b`, configurable con `GROQ_MODEL`). El tutor devuelve un nivel de logro (*Lo logré*, *Parcialmente* o *Debo repasar*), fortalezas, aspectos por mejorar, una revisión de cada criterio y una pregunta para profundizar, y propone la autoevaluación, que el estudiante puede cambiar. Si el estudiante edita su respuesta, puede pedir una nueva revisión.

- La llamada se hace en una Edge Function (`supabase/functions/tutor`), así la clave de Groq nunca llega al navegador.
- Límite diario por usuario en la base de datos: 15 usos en el plan gratuito, 100 en Premium y 200 para profesores (`supabase/migrations/20261015000000_ai_tutor.sql` y `20261016000000_teacher_insights.sql`).
- Sin Supabase (modo local), el botón no aparece.

Para activarlo:

```bash
supabase link --project-ref orlnrwjvxuetpupcsept
supabase db push                                  # o ejecuta la migración en el SQL Editor
supabase secrets set GROQ_API_KEY=gsk_...        # console.groq.com → API Keys
supabase functions deploy tutor
```

## Funciones clave

- **Lector:** paginación real por columnas (se adapta a la pantalla, tamaño y tipo de letra), animación 3D de pasar página, índice, marcadores, búsqueda con resaltado, modo oscuro, lectura en voz alta (voz del navegador) que avanza las páginas sola. Guarda capítulo, posición y porcentaje.
- **Audio:** reproductor completo + mini-player persistente, ±10 s, pistas, velocidad, volumen, controles del sistema (Media Session). Se restaura tras recargar.
- **Leer sin conexión:** el texto se guarda en Cache Storage y un service worker permite abrir la app y leer los libros guardados sin conexión (en `build`/`preview`, no en `dev`).
- **Descarga en PDF:** genera en el navegador un PDF real (A5, portada, índice, Noto Serif). Todos los planes llevan una marca de agua con el correo del lector, salvo el plan **Anual** (`src/lib/pdf.ts`). Como los textos son públicos, la marca es disuasiva, no una protección técnica.
- **Profesores:** al registrarse se elige el rol (Estudiante o Profesor). El profesor indica su establecimiento y asignatura, crea cursos en **Mis cursos** (`/aula`), comparte un código de 6 caracteres, publica tareas (con libro y práctica opcionales) y revisa las entregas con nota de 1,0 a 7,0 y retroalimentación. El estudiante se une con el código desde **Mis tareas**, entrega su respuesta (editable hasta que se revise) y ve su nota.
- **Premium:** los libros Premium permiten leer los 2 primeros capítulos y escuchar la primera pista. Los planes se pagan con **Stripe Checkout** (ver [Pagos con Stripe](#pagos-con-stripe)); al terminar, la página **¡Muchas gracias por tu compra!** (`/premium/gracias`) muestra el comprobante con confeti.

## Backend: Supabase

El proyecto se conecta a Supabase (`orlnrwjvxuetpupcsept`) para cuentas y datos:

1. Copia `.env.example` a `.env.local` y pega la **anon / publishable key** (Project Settings → API).
2. Ejecuta `supabase/migrations/20261006000000_init.sql` en el SQL Editor del panel (o `supabase db push`). Crea:
   - `profiles`: nombre, avatar, plan… (se crea sola al registrarse, con RLS).
   - `user_state`: favoritos, progreso, marcadores, tareas, prácticas, notificaciones y audio de cada usuario, con RLS.
3. Ejecuta después `supabase/migrations/20261009000000_classroom.sql`. Agrega `role`, `school` y `subject` a `profiles` y crea `courses`, `course_members`, `assignments` y `submissions`, con RLS: el profesor solo ve sus cursos y sus entregas; el estudiante solo sus cursos y su propia entrega, y no puede ponerse nota.
4. En Authentication → URL Configuration agrega `http://localhost:5173/**` (y tu dominio) a *Redirect URLs*. Para Google, activa el proveedor en Authentication → Providers.

- **Auth real:** correo/contraseña, Google (OAuth), confirmación por correo, recuperación de contraseña (`/reset-password`) y cambio de correo.
- **Sincronización:** los datos se guardan al instante en `localStorage` y se replican a Supabase; al entrar desde otro dispositivo se recuperan. Las descargas sin conexión y las preferencias de visualización quedan en cada dispositivo.
- **Sin variables de entorno** la app funciona en modo local (todo en `localStorage`, con la cuenta demo `javier@biblioteca.edu` / `demo1234`).
- El plan solo lo cambia el servidor: la migración `20261017000000_stripe.sql` quita a los usuarios el permiso de escribir `profiles.plan`.

## Pagos con Stripe

Los pagos usan **Stripe Checkout en modo de prueba**: no se cobra dinero real. Los precios (USD 9,99 al mes y USD 99,99 al año) se crean en cada pago (`supabase/functions/_shared/billing.ts`), así que no hace falta crear productos en Stripe.

1. Crea una cuenta en [stripe.com](https://stripe.com), deja activado el **modo de prueba** y copia la clave secreta (`sk_test_…`) en Developers → API keys.
2. Ejecuta la migración `supabase/migrations/20261017000000_stripe.sql`.
3. Configura y despliega:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase functions deploy payments
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
4. En Stripe → Developers → Webhooks, agrega el endpoint `https://<proyecto>.supabase.co/functions/v1/stripe-webhook` con los eventos `checkout.session.completed` y `customer.subscription.deleted`, y guarda su secreto: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`. El webhook es un respaldo: la página de gracias también confirma el pago con Stripe.
5. Opcional: `supabase secrets set APP_URL=https://tu-dominio` para fijar a dónde vuelve Stripe después del pago (si no, usa el origen de la app).

**Para probar:** en Premium elige un plan y paga con la tarjeta **4242 4242 4242 4242**, cualquier fecha futura, cualquier CVC y cualquier nombre. La tarjeta también se muestra, con un botón para copiarla, en la ventana de confirmación. Si cancelas en Stripe, vuelves a Premium con el aviso de que no se hizo ningún cobro. Cambiar al plan Gratis cancela la suscripción.

Sin Supabase (modo local), la compra se simula y lleva a la misma página de agradecimiento.
