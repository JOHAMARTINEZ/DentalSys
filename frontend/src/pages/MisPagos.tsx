import { useCallback, useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'

import { apiGet, apiPost, mensajeError } from '../services/api'
import { imprimirComprobante } from '../services/imprimir'
import { alCerrar } from '../services/dialogos'

/* =========================================================
   MIS PAGOS (portal del paciente)
   - Saldos pendientes (presupuestos aceptados y atenciones).
   - PAGO DE DEMOSTRACIÓN: simula un pago con tarjeta y lo
     registra marcado como demo. No se cobra dinero real ni
     se piden datos de tarjeta.
   - Historial de pagos y comprobantes.
========================================================= */

const GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)'
const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

interface Pendiente {
  tipo: 'PRESUPUESTO' | 'ATENCION'
  id: number
  descripcion: string
  fecha: string
  total: number
  pagado: number
  saldo: number
}

interface Pago {
  idPago: number
  fechaHora: string
  monto: number
  medioPago: string
  estado: 'PAGADO' | 'ANULADO'
  pacienteNombre: string
  pacienteRut: string
  concepto: string
  observacion: string | null
  registradoPor: string | null
  folio: string | null
  estadoComprobante: string | null
  sucursalNombre: string | null
  sucursalDireccion: string | null
  motivoAnulacion: string | null
}

const MEDIOS: Record<string, string> = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }

function MisPagos() {
  const [pendientes, setPendientes] = useState<Pendiente[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [pagando, setPagando] = useState<Pendiente | null>(null)
  const [monto, setMonto] = useState('')
  const [errorPago, setErrorPago] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState<Pago | null>(null)
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [p, h] = await Promise.all([
        apiGet<Pendiente[]>('/api/portal/pendientes'),
        apiGet<Pago[]>('/api/pagos/mis-pagos'),
      ])
      setPendientes(p)
      setPagos(h)
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar tus pagos.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  const totalPendiente = pendientes.reduce((t, p) => t + Number(p.saldo), 0)
  const totalPagado = pagos.filter((p) => p.estado === 'PAGADO').reduce((t, p) => t + Number(p.monto), 0)

  const pagarDemo = async () => {
    if (!pagando) return
    const valor = Number(monto)
    if (!(valor > 0)) { setErrorPago('Ingresa un monto mayor que cero.'); return }
    if (valor > Number(pagando.saldo)) { setErrorPago('El monto supera tu saldo pendiente.'); return }

    setGuardando(true)
    setErrorPago('')
    try {
      const pago = await apiPost<Pago>('/api/pagos/mis-pagos/demo', {
        idPresupuesto: pagando.tipo === 'PRESUPUESTO' ? pagando.id : null,
        idAtencion: pagando.tipo === 'ATENCION' ? pagando.id : null,
        monto: valor,
      })
      setPagando(null)
      setExito(pago)
      await cargar()
    } catch (err) {
      setErrorPago(mensajeError(err, 'No fue posible registrar el pago.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      {/* ===== Resumen ===== */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ p: 3, height: '100%', boxShadow: '0 40px 80px -50px rgba(11,18,32,.45)' }}>
            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Saldo pendiente</Typography>
            {cargando ? <Skeleton width={140} height={50} /> : (
              <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, color: totalPendiente > 0 ? '#b45309' : '#047857' }}>
                {totalPendiente > 0 ? pesos.format(totalPendiente) : 'Al día'}
              </Typography>
            )}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card sx={{ p: 3, height: '100%', boxShadow: '0 40px 80px -50px rgba(11,18,32,.45)' }}>
            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>Total pagado</Typography>
            {cargando ? <Skeleton width={140} height={50} /> : <Typography sx={{ fontSize: '2.2rem', fontWeight: 800 }}>{pesos.format(totalPagado)}</Typography>}
          </Card>
        </Grid>
      </Grid>

      {/* ===== Pendientes ===== */}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Por pagar</Typography>
        {cargando && <Skeleton variant="rounded" height={70} />}
        {!cargando && pendientes.length === 0 && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            <TaskAltRoundedIcon color="success" />
            <Typography>No tienes saldos pendientes.</Typography>
          </Stack>
        )}
        <Stack spacing={1.25}>
          {pendientes.map((p) => (
            <Stack key={`${p.tipo}-${p.id}`} direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', alignItems: { sm: 'center' } }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>{p.descripcion}</Typography>
                <Typography variant="body2" color="text.secondary">Total {pesos.format(p.total)} · Pagado {pesos.format(p.pagado)}</Typography>
              </Box>
              <Box sx={{ textAlign: { sm: 'right' } }}>
                <Typography variant="caption" color="text.secondary">Saldo</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.15rem' }}>{pesos.format(p.saldo)}</Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<PaymentsOutlinedIcon />}
                onClick={() => { setPagando(p); setMonto(String(Math.round(p.saldo))); setErrorPago('') }}
                sx={{ background: GRADIENT, alignSelf: { xs: 'flex-start', sm: 'center' } }}
              >
                Pagar
              </Button>
            </Stack>
          ))}
        </Stack>
      </Card>

      {/* ===== Historial ===== */}
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Pagos realizados</Typography>
        {cargando && <Skeleton variant="rounded" height={70} />}
        {!cargando && pagos.length === 0 && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', color: 'text.secondary' }}>
            <ReceiptLongOutlinedIcon />
            <Typography>Aún no tienes pagos registrados.</Typography>
          </Stack>
        )}
        <Stack spacing={1}>
          {pagos.map((p) => {
            const demo = (p.observacion ?? '').toLowerCase().includes('demostración')
            return (
              <Stack key={p.idPago} direction="row" spacing={2} sx={{ p: 1.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', alignItems: 'center', opacity: p.estado === 'ANULADO' ? 0.6 : 1 }}>
                <ReceiptLongOutlinedIcon color="action" />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, textDecoration: p.estado === 'ANULADO' ? 'line-through' : 'none' }}>{pesos.format(p.monto)}</Typography>
                    {demo && <Chip size="small" label="Demo" color="warning" variant="outlined" />}
                    {p.estado === 'ANULADO' && <Chip size="small" label="Anulado" color="error" variant="outlined" />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {p.concepto} · {MEDIOS[p.medioPago] ?? p.medioPago} · {new Date(p.fechaHora).toLocaleDateString('es-CL')} · {p.folio}
                  </Typography>
                </Box>
                <Tooltip title="Ver o imprimir comprobante">
                  <IconButton onClick={() => imprimirComprobante(p)} aria-label="Ver comprobante"><PrintOutlinedIcon /></IconButton>
                </Tooltip>
              </Stack>
            )
          })}
        </Stack>
      </Card>

      {/* ===== Pago de demostración ===== */}
      <Dialog open={pagando !== null} onClose={alCerrar(() => setPagando(null), { bloqueado: guardando })} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Pagar {pagando?.descripcion}</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" icon={<ScienceOutlinedIcon />} sx={{ mb: 2 }}>
            <strong>Pago de demostración.</strong> El sistema aún no está conectado a una pasarela de pago: no se cobra dinero ni se piden datos de tu tarjeta. El pago quedará registrado y marcado como demo.
          </Alert>
          {errorPago && <Alert severity="error" sx={{ mb: 2 }}>{errorPago}</Alert>}
          {pagando && (
            <Typography color="text.secondary" sx={{ mb: 2 }}>Saldo pendiente: <strong>{pesos.format(pagando.saldo)}</strong></Typography>
          )}
          <TextField
            label="Monto a pagar" type="number" value={monto} onChange={(e) => setMonto(e.target.value)}
            helperText="Puedes pagar el total o abonar una parte."
            slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> }, htmlInput: { min: 1 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setPagando(null)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={() => void pagarDemo()} disabled={guardando} sx={{ background: GRADIENT }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Confirmar pago demo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Pago exitoso ===== */}
      <Dialog open={exito !== null} onClose={alCerrar(() => setExito(null), { escape: true })} fullWidth maxWidth="xs">
        {exito && (
          <>
            <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
              <TaskAltRoundedIcon sx={{ fontSize: 64, color: '#059669' }} />
              <Typography variant="h6" sx={{ mt: 1 }}>Pago registrado</Typography>
              <Typography sx={{ fontSize: '2rem', fontWeight: 800 }}>{pesos.format(exito.monto)}</Typography>
              <Typography color="text.secondary">Comprobante {exito.folio}</Typography>
              <Chip size="small" label="Pago de demostración" color="warning" variant="outlined" sx={{ mt: 1.5 }} />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
              <Button startIcon={<PrintOutlinedIcon />} onClick={() => imprimirComprobante(exito)}>Ver comprobante</Button>
              <Button variant="contained" onClick={() => { setExito(null); setAviso('Tu saldo fue actualizado.') }} sx={{ background: GRADIENT }}>Listo</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={3500} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>{aviso}</Alert>
      </Snackbar>
    </Stack>
  )
}

export default MisPagos
