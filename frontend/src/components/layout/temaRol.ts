import type { Rol } from '../../services/api'

/* =========================================================
   IDENTIDAD VISUAL POR ROL (portal de gestión)
   Todo el sistema comparte la misma base (azul marino, tipografía,
   tarjetas), pero cada rol tiene su color de acento para que
   se reconozca de inmediato en qué perfil se está trabajando:
   - Administración: índigo
   - Recepción: verde azulado
   - Odontólogo: azul clínico
   Los colores se publican como variables CSS (--rol-*) para que
   cualquier página, diálogo o menú flotante los use.
========================================================= */

export interface TemaRol {
  /** Nombre del espacio de trabajo */
  espacio: string
  /** Frase corta bajo el nombre */
  lema: string
  main: string
  dark: string
  light: string
  /** Fondo muy suave (íconos, chips) */
  tint: string
  /** Degradado de botones y acentos */
  gradiente: string
  /** Sombra de color para elementos destacados */
  sombra: string
}

const ODONTOLOGO: TemaRol = {
  espacio: 'Consulta clínica',
  lema: 'Tu agenda, fichas y presupuestos',
  main: '#2563eb',
  dark: '#1d4ed8',
  light: '#60a5fa',
  tint: '#eef4ff',
  gradiente: 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)',
  sombra: 'rgba(37, 99, 235, .35)',
}

export const TEMAS_ROL: Record<Exclude<Rol, 'PACIENTE'>, TemaRol> = {
  ADMIN: {
    espacio: 'Administración',
    lema: 'Personal, catálogo y control de la clínica',
    main: '#4f46e5',
    dark: '#4338ca',
    light: '#a5b4fc',
    tint: '#eef0ff',
    gradiente: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
    sombra: 'rgba(79, 70, 229, .35)',
  },
  RECEPCIONISTA: {
    espacio: 'Recepción',
    lema: 'Agenda, pacientes y caja del día',
    main: '#0d9488',
    dark: '#0f766e',
    light: '#5eead4',
    tint: '#e8faf7',
    gradiente: 'linear-gradient(135deg, #0d9488 0%, #22d3ee 100%)',
    sombra: 'rgba(13, 148, 136, .35)',
  },
  ODONTOLOGO,
}

export function temaDeRol(rol: Rol | null): TemaRol {
  if (rol && rol !== 'PACIENTE') {
    return TEMAS_ROL[rol]
  }
  return ODONTOLOGO
}

/** Variables CSS que usan las páginas: var(--rol-main), var(--rol-gradiente), etc. */
export function variablesCss(tema: TemaRol): Record<string, string> {
  return {
    '--rol-main': tema.main,
    '--rol-dark': tema.dark,
    '--rol-light': tema.light,
    '--rol-tint': tema.tint,
    '--rol-gradiente': tema.gradiente,
    '--rol-sombra': tema.sombra,
  }
}
