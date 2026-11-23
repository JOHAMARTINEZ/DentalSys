/* =========================================================
   IMPRESIÓN DE COMPROBANTES Y PRESUPUESTOS
   Abre una ventana con un documento simple y llama a imprimir.
   Desde el diálogo de impresión del navegador también se
   puede "Guardar como PDF".
========================================================= */

const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

function escapar(texto: string | null | undefined): string {
  return (texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fecha(valor: string): string {
  return new Date(valor).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
}

const ESTILOS = `
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", system-ui, sans-serif; color: #0b1220; margin: 0; padding: 32px; }
  .doc { max-width: 720px; margin: 0 auto; }
  .cabecera { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 16px; }
  .marca { font-size: 22px; font-weight: 800; }
  .sub { color: #526077; font-size: 13px; }
  h1 { font-size: 20px; margin: 24px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e6eaf2; }
  th { background: #f5f7fb; color: #526077; font-size: 12px; text-transform: uppercase; }
  .derecha { text-align: right; }
  .total { font-size: 18px; font-weight: 800; }
  .anulado { color: #b91c1c; border: 2px solid #b91c1c; padding: 6px 12px; display: inline-block; font-weight: 800; margin-top: 12px; }
  .demo { color: #b45309; border: 2px dashed #b45309; padding: 6px 12px; display: inline-block; font-weight: 700; margin-top: 12px; }
  .pie { margin-top: 32px; color: #526077; font-size: 12px; }
  @media print { body { padding: 0; } }
`

/**
 * Imprime usando un marco oculto dentro de la misma página.
 * A diferencia de abrir una ventana nueva, el navegador no lo bloquea
 * aunque se llame después de guardar (por ejemplo, al registrar un pago).
 */
function abrirEImprimir(titulo: string, cuerpo: string) {
  const marco = document.createElement('iframe')
  marco.setAttribute('aria-hidden', 'true')
  marco.title = titulo
  Object.assign(marco.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    visibility: 'hidden',
  })
  document.body.appendChild(marco)

  const doc = marco.contentDocument
  const ventana = marco.contentWindow
  if (!doc || !ventana) {
    marco.remove()
    return
  }

  doc.open()
  doc.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${escapar(titulo)}</title><style>${ESTILOS}</style></head><body><div class="doc">${cuerpo}</div></body></html>`)
  doc.close()

  // Se quita el marco cuando termina la impresión (o, por seguridad, al minuto)
  const quitar = () => setTimeout(() => marco.remove(), 500)
  ventana.addEventListener('afterprint', quitar, { once: true })
  setTimeout(() => marco.remove(), 60000)

  setTimeout(() => {
    ventana.focus()
    ventana.print()
  }, 250)
}

export interface PagoImprimible {
  folio: string | null
  fechaHora: string
  monto: number
  medioPago: string
  estado: string
  estadoComprobante: string | null
  pacienteNombre: string
  pacienteRut: string
  concepto: string
  observacion: string | null
  registradoPor: string | null
  sucursalNombre: string | null
  sucursalDireccion: string | null
  motivoAnulacion: string | null
}

const MEDIOS: Record<string, string> = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }

export function imprimirComprobante(pago: PagoImprimible) {
  const anulado = pago.estado === 'ANULADO' || pago.estadoComprobante === 'ANULADO'
  const demo = (pago.observacion ?? '').toLowerCase().includes('demostración')

  abrirEImprimir(`Comprobante ${pago.folio ?? ''}`, `
    <div class="cabecera">
      <div>
        <div class="marca">Clínica Más Dent</div>
        <div class="sub">${escapar(pago.sucursalNombre)}${pago.sucursalDireccion ? ` · ${escapar(pago.sucursalDireccion)}` : ''}</div>
      </div>
      <div class="derecha">
        <div class="sub">Comprobante de pago</div>
        <div class="total">${escapar(pago.folio)}</div>
      </div>
    </div>
    <h1>Detalle del pago</h1>
    <table>
      <tr><th>Fecha</th><td>${fecha(pago.fechaHora)}</td></tr>
      <tr><th>Paciente</th><td>${escapar(pago.pacienteNombre)} · ${escapar(pago.pacienteRut)}</td></tr>
      <tr><th>Concepto</th><td>${escapar(pago.concepto)}</td></tr>
      <tr><th>Medio de pago</th><td>${escapar(MEDIOS[pago.medioPago] ?? pago.medioPago)}</td></tr>
      ${pago.observacion ? `<tr><th>Observación</th><td>${escapar(pago.observacion)}</td></tr>` : ''}
      <tr><th>Registrado por</th><td>${escapar(pago.registradoPor ?? '—')}</td></tr>
      <tr><th>Monto</th><td class="total">${pesos.format(pago.monto)}</td></tr>
    </table>
    ${anulado ? `<div class="anulado">COMPROBANTE ANULADO${pago.motivoAnulacion ? ` · ${escapar(pago.motivoAnulacion)}` : ''}</div>` : ''}
    ${demo ? '<div class="demo">Pago de demostración: no corresponde a un cobro real</div>' : ''}
    <div class="pie">Documento generado por DentalSys. Conserve este comprobante.</div>
  `)
}

export interface PresupuestoImprimible {
  idPresupuesto: number
  fechaEmision: string
  fechaVencimiento: string
  estado: string
  montoTotal: number
  totalAbonado: number
  saldoPendiente: number
  pacienteNombre: string
  pacienteRut: string
  odontologoNombre: string
  sucursalNombre: string
  tratamientos: {
    nombre: string
    cantidad: number
    costoAplicado: number
    subtotal: number
    piezas: { pieza: string; superficies: string | null }[]
  }[]
}

export function imprimirPresupuesto(p: PresupuestoImprimible) {
  const dia = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL')
  const filas = p.tratamientos.map((t) => `
    <tr>
      <td>${escapar(t.nombre)}${t.piezas.length ? `<div class="sub">Piezas: ${t.piezas.map((x) => `${escapar(x.pieza)}${x.superficies ? ` (${escapar(x.superficies)})` : ''}`).join(', ')}</div>` : ''}</td>
      <td class="derecha">${t.cantidad}</td>
      <td class="derecha">${pesos.format(t.costoAplicado)}</td>
      <td class="derecha">${pesos.format(t.subtotal)}</td>
    </tr>`).join('')

  abrirEImprimir(`Presupuesto N° ${p.idPresupuesto}`, `
    <div class="cabecera">
      <div>
        <div class="marca">Clínica Más Dent</div>
        <div class="sub">${escapar(p.sucursalNombre)} · ${escapar(p.odontologoNombre)}</div>
      </div>
      <div class="derecha">
        <div class="sub">Presupuesto</div>
        <div class="total">N° ${p.idPresupuesto}</div>
      </div>
    </div>
    <h1>${escapar(p.pacienteNombre)} · ${escapar(p.pacienteRut)}</h1>
    <div class="sub">Emitido el ${dia(p.fechaEmision)} · Válido hasta el ${dia(p.fechaVencimiento)} · Estado: ${escapar(p.estado)}</div>
    <table>
      <tr><th>Tratamiento</th><th class="derecha">Cant.</th><th class="derecha">Valor</th><th class="derecha">Subtotal</th></tr>
      ${filas}
      <tr><td colspan="3" class="derecha total">Total</td><td class="derecha total">${pesos.format(p.montoTotal)}</td></tr>
      <tr><td colspan="3" class="derecha">Abonado</td><td class="derecha">${pesos.format(p.totalAbonado)}</td></tr>
      <tr><td colspan="3" class="derecha">Saldo</td><td class="derecha">${pesos.format(p.saldoPendiente)}</td></tr>
    </table>
    <div class="pie">Documento generado por DentalSys.</div>
  `)
}
