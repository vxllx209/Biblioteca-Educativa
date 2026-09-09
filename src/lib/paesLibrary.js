import { slug } from './slug.js'

/**
 * Biblioteca curada de ensayos, temarios y claves de respuesta de la PAES
 * (Prueba de Acceso a la Educación Superior), separada del contenido curricular
 * de cada materia. Se organiza por prueba PAES, no por asignatura escolar.
 */
export const PAES_LIBRARY = {
  'paes-lectora': [
    {
      title: 'PAES Competencia Lectora – Prueba Oficial 2024',
      topic: 'Ensayo oficial PAES Competencia Lectora, Admisión 2024',
      year: 2024,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2024-23-11-28-paes-regular-oficial-competencia-lectora-p2024.pdf',
    },
    {
      title: 'PAES Competencia Lectora – Prueba Oficial 2023',
      topic: 'Ensayo oficial PAES Competencia Lectora, Admisión 2023',
      year: 2023,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2023-22-11-29-paes-oficial-competencia-lectora-p2023.pdf',
    },
    {
      title: 'PAES Competencia Lectora Invierno – Prueba Oficial 2024',
      topic: 'Ensayo PAES Competencia Lectora, Admisión Invierno 2024',
      year: 2024,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2024-23-06-20-paes-invierno-oficial-competencia-lectora-p2024.pdf',
    },
    {
      title: 'Temario PAES Competencia Lectora',
      topic: 'Contenidos y habilidades evaluadas en la PAES de Competencia Lectora',
      year: 2024,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2024-23-03-23-temario-paes-regular-competencia-lectora.pdf',
    },
    {
      title: 'Clavijero PAES Competencia Lectora 2024 (Respuestas)',
      topic: 'Claves de respuestas del ensayo PAES Competencia Lectora, Admisión 2024',
      year: 2024,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2024-23-12-28-clavijero-paes-regular-competencia-lectora.pdf',
    },
    {
      title: 'Clavijero PAES Competencia Lectora 2023 (Respuestas)',
      topic: 'Claves de respuestas del ensayo PAES Competencia Lectora, Admisión 2023',
      year: 2023,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2023-22-12-29-clavijero-paes-competencia-lectora.pdf',
    },
    {
      title: 'Modelo de Prueba de Comprensión Lectora 2023',
      topic: 'Ensayo modelo de Comprensión Lectora (PDT), Admisión 2023',
      year: 2023,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2023-22-03-31-modelo-comprension-lectora-p2023.pdf',
    },
    {
      title: 'Modelo de Prueba de Comprensión Lectora 2022',
      topic: 'Ensayo modelo de Comprensión Lectora (PDT), Admisión 2022',
      year: 2022,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2022-21-07-08-modelo-comprension-lectora-p2022.pdf',
    },
    {
      title: 'Modelo de Prueba de Comprensión Lectora 2021',
      topic: 'Ensayo modelo de Comprensión Lectora (PDT), Admisión 2021',
      year: 2021,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2021-20-06-11-modelo-comprension-lectora.pdf',
    },
    {
      title: 'Guía de Preparación: Competencia Lectora PAES',
      topic: 'Orientaciones y práctica para la prueba PAES de Competencia Lectora',
      year: 2024,
      source: 'MINEDUC (Programa Acceso)',
      url: 'https://acceso.mineduc.cl/wp-content/uploads/2024/06/Competencia-Lectora.pdf',
    },
  ],
  'paes-m1': [
    {
      title: 'Clave de Respuestas PAES Regular Matemática M1',
      topic: 'Ensayo PAES Admisión 2025 (Proceso Regular) - Competencia Matemática 1',
      year: 2025,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2025-25-01-06-clavijero-paes-regular-m1.pdf',
    },
    {
      title: 'Clave de Respuestas PAES Invierno Matemática M1',
      topic: 'Ensayo PAES Admisión 2025 (Proceso Invierno) - Competencia Matemática 1',
      year: 2025,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2025-24-07-19-clavijero-paes-invierno-m1.pdf',
    },
    {
      title: 'Clave de Respuestas PAES Invierno M1 (Forma 111)',
      topic: 'Ensayo PAES Admisión 2024 (Proceso Invierno) - Competencia Matemática 1',
      year: 2024,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2024-23-07-20-clavijero-paes-invierno-m1.pdf',
    },
    {
      title: 'Temario Oficial PAES Regular Matemática M1',
      topic: 'Contenidos y ejes temáticos - Competencia Matemática 1',
      year: 2026,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2026-25-03-20-temario-paes-regular-m1.pdf',
    },
    {
      title: 'Ensayo Matemática IV Medio con Respuestas',
      topic: 'Ensayo de práctica tipo admisión (álgebra, funciones, geometría, probabilidad)',
      year: 2023,
      source: 'Universidad de los Andes (admisión)',
      url: 'https://admision.uandes.cl/docs/default-source/ensayos/ensayo-matem%C3%A1tica-iv-medio-con-respuestas.pdf?sfvrsn=17d623e4_2',
    },
  ],
  'paes-m2': [
    {
      title: 'Clave de Respuestas PAES Regular Matemática M2',
      topic: 'Ensayo PAES Admisión 2025 (Proceso Regular) - Competencia Matemática 2',
      year: 2025,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2025-25-01-06-clavijero-paes-regular-m2.pdf',
    },
    {
      title: 'Clave de Respuestas PAES Invierno Matemática M2',
      topic: 'Ensayo PAES Admisión 2025 (Proceso Invierno) - Competencia Matemática 2',
      year: 2025,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2025-24-07-19-clavijero-paes-invierno-m2.pdf',
    },
    {
      title: 'Temario Oficial PAES Regular Matemática M2',
      topic: 'Contenidos y ejes temáticos - Competencia Matemática 2',
      year: 2026,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2026-25-03-20-temario-paes-regular-m2.pdf',
    },
  ],
  'paes-historia': [
    {
      title: 'PAES Oficial Historia y Ciencias Sociales 2024',
      topic: 'Ensayo PAES Admisión 2024 (Prueba Regular)',
      year: 2024,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2024-23-11-29-paes-regular-oficial-historia-p2024.pdf',
    },
    {
      title: 'Clavijero PAES Regular Historia 2024',
      topic: 'Respuestas correctas Ensayo PAES Admisión 2024',
      year: 2024,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2024-23-12-28-clavijero-paes-regular-historia.pdf',
    },
    {
      title: 'PAES Regular Historia y Ciencias Sociales 2025',
      topic: 'Ensayo PAES Admisión 2025 (Prueba Regular)',
      year: 2025,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2025-24-12-04-paes-regular-historia-p2025.pdf',
    },
    {
      title: 'PAES Invierno Oficial Historia 2025',
      topic: 'Ensayo PAES Invierno Admisión 2025',
      year: 2025,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2025-24-06-19-paes-invierno-oficial-historia-p2025.pdf',
    },
    {
      title: 'PAES Invierno Oficial Historia 2026',
      topic: 'Ensayo PAES Invierno Admisión 2026',
      year: 2026,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2026-25-06-18-paes-invierno-oficial-historia-p2026.pdf',
    },
    {
      title: 'Temario PAES Regular Historia y Cs. Sociales 2025',
      topic: 'Temario oficial de contenidos Historia y Ciencias Sociales',
      year: 2025,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2025-24-03-21-temario-paes-regular-historia.pdf',
    },
    {
      title: 'PAES Oficial Historia y Ciencias Sociales 2023',
      topic: 'Ensayo PAES Admisión 2023 (Prueba Regular)',
      year: 2023,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2023-22-11-30-paes-oficial-historia-p2023.pdf',
    },
  ],
  'paes-ciencias': [
    {
      title: 'Ensayo PAES Ciencias Biología (preguntas marcadas)',
      topic: 'Ensayo PAES Ciencias - Admisión 2023',
      year: 2022,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2023-22-07-15-pdt-oficial-ciencias-biologia-marcadas-p2023.pdf',
    },
    {
      title: 'Ensayo PAES Ciencias Física (preguntas marcadas)',
      topic: 'Ensayo PAES Ciencias - Admisión 2023',
      year: 2022,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2023-22-07-15-pdt-oficial-ciencias-fisica-marcadas-p2023.pdf',
    },
    {
      title: 'Ensayo PAES Ciencias Química (preguntas marcadas)',
      topic: 'Ensayo PAES Ciencias - Admisión 2023',
      year: 2022,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2023-22-07-15-pdt-oficial-ciencias-quimica-marcadas-p2023.pdf',
    },
    {
      title: 'Modelo de Prueba de Transición Ciencias - Biología',
      topic: 'Ensayo PAES Ciencias Admisión 2023',
      year: 2022,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2023-22-03-31-modelo-ciencias-biologia.pdf',
    },
    {
      title: 'Modelo de Prueba de Transición Ciencias - Química',
      topic: 'Ensayo PAES Ciencias Admisión 2023',
      year: 2022,
      source: 'DEMRE',
      url: 'https://historico.demre.cl/publicaciones/pdf/2023-22-03-31-modelo-ciencias-quimica.pdf',
    },
    {
      title: 'Selección de Preguntas PAES Regular Ciencias Física',
      topic: 'Ensayo PAES Ciencias Admisión 2025',
      year: 2024,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2025-24-12-03-paes-regular-ciencias-fisica-p2025.pdf',
    },
    {
      title: 'Selección de Preguntas PAES Regular Ciencias Química',
      topic: 'Ensayo PAES Ciencias Admisión 2025',
      year: 2024,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2025-24-12-03-paes-regular-ciencias-quimica-p2025.pdf',
    },
    {
      title: 'Selección de Preguntas PAES Regular Ciencias Biología',
      topic: 'Ensayo PAES Ciencias Admisión 2026',
      year: 2025,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2026-25-12-02-paes-regular-ciencias-biologia-p2026.pdf',
    },
    {
      title: 'Temario PAES Regular - Prueba Electiva de Ciencias',
      topic: 'Temario oficial PAES Ciencias Admisión 2026',
      year: 2025,
      source: 'DEMRE',
      url: 'https://demre.cl/publicaciones/pdf/2026-25-03-20-temario-paes-regular-ciencias.pdf',
    },
  ],
}

export function getPaesSeedPdfs(subjectKey) {
  const entries = PAES_LIBRARY[subjectKey] || []
  return entries.map((entry, i) => ({
    id: `paes-seed-${subjectKey}-${slug(entry.title)}-${i}`,
    subject: subjectKey,
    title: entry.title,
    topic: entry.topic,
    uploader_name: entry.source,
    created_at: `${entry.year}-01-01T00:00:00.000Z`,
    url: entry.url,
    isSeed: true,
  }))
}
