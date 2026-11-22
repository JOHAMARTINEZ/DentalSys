/* =========================================================
   CIERRE DE DIÁLOGOS
   Regla del sistema: ningún diálogo se cierra por hacer clic
   afuera, para no perder lo que se estaba escribiendo.
   - Formularios y confirmaciones: solo se cierran con sus
     botones (Cancelar / Volver / X). Escape tampoco los cierra.
   - Vistas de solo lectura (detalle): se cierran con su botón
     o con la tecla Escape.
   - Mientras se guarda (bloqueado = true) no se cierra nada.
========================================================= */

type MotivoCierre = 'backdropClick' | 'escapeKeyDown'

interface OpcionesCierre {
  /** Permite cerrar con la tecla Escape (solo vistas de lectura). */
  escape?: boolean
  /** Impide cerrar (por ejemplo, mientras se guarda). */
  bloqueado?: boolean
}

export function alCerrar(cerrar: () => void, opciones: OpcionesCierre = {}) {
  return (_evento: unknown, motivo?: MotivoCierre) => {
    if (opciones.bloqueado) return
    if (motivo === 'backdropClick') return
    if (motivo === 'escapeKeyDown' && !opciones.escape) return
    cerrar()
  }
}
