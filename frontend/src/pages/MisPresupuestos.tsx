import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'

import { apiGet, apiPut, mensajeError } from '../services/api'
import { imprimirPresupuesto } from '../services/imprimir'

/* =========================================================
   MIS PRESUPUESTOS (portal del paciente)
   - Ver tratamientos, total, abonado y saldo.
   - Aceptar o rechazar los pendientes.
   - Imprimir o guardar como PDF.
========================================================= */

const GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)'
const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

type Estado = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'VENCIDO' | 'ANULADO'

interface Presupuesto {
  idPresupuesto: number
  fechaEmision: string
  fechaVencimiento: string
  estado: Estado
  montoTotal: number
  totalAbonado: number
  saldoPendiente: number
  pacienteNombre: string
  pacienteRut: string
  odontologoNombre: string
  sucursalNombre: string
  tratamientos: {
    idTratamiento: number
    nombre: string
    cantidad: number
    costoAplicado: number
    subtotal: number
    piezas: { pieza: string; superficies: string | null }[]
  }[]
}

const ESTADOS: Record<Estado, { label: string; color: string; fondo: string }> = {
  PENDIENTE: { label: 'Esperando tu respuesta', color: '#b45309', fondo: '#fef3c7' },
  ACEPTADO: { label: 'Aceptado', color: '#047857', fondo: '#d1fae5' },
  RECHAZADO: { label: 'Rechazado', color: '#b91c1c', fondo: '#fee2e2' },
  VENCIDO: { label: 'Vencido', color: '#64748b', fondo: '#f1f5f9' },
  ANULADO: { label: 'Anulado', color: '#64748b', fondo: '#f1f5f9' },
}

function dia(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function MisPresupuestos() {
  const navigate = useNavigate()
  const [lista, setLista] = useState<Presupuesto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [respuesta, setRespuesta] = useState<{ p: Presupuesto; estado: 'ACEPTADO' | 'RECHAZADO' } | null>(null)
  const [errorRespuesta, setErrorRespuesta] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      setLista(await apiGet<Presupuesto[]>('/api/presupuestos/mis-presupuestos'))
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar tus presupuestos.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  const responder = async () => {
    if (!respuesta) return
    setGuardando(true)
    setErrorRespuesta('')
    try {
      await apiPut(`/api/presupuestos/mis-presupuestos/${respuesta.p.idPresupuesto}/responder`, { estado: respuesta.estado })
      setAviso(respuesta.estado === 'ACEPTADO' ? 'Aceptaste el presupuesto. Tu respuesta quedó registrada.' : 'Rechazaste el presupuesto.')
      setRespuesta(null)
      await cargar()
    } catch (err) {
      setErrorRespuesta(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cargando && <Stack spacing={2}>{[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: 5 }} />)}</Stack>}

      {!cargando && lista.length === 0 && !error && (
        <Card sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
          <RequestQuoteOutlinedIcon sx={{ fontSize: 48, color: '#c3cbe0' }} />
          <Typography sx={{ mt: 1, fontWeight: 700, color: 'text.primary' }}>No tienes presupuestos</Typography>
          <Typography variant="body2">Cuando tu odontólogo te emita uno, aparecerá aquí.</Typography>
        </Card>
      )}

      <Stack spacing={2}>
        {lista.map((p) => {
          const estado = ESTADOS[p.estado]
          const avance = Number(p.montoTotal) > 0 ? (Number(p.totalAbonado) / Number(p.montoTotal)) * 100 : 0
          return (
            <Card key={p.idPresupuesto} sx={{ p: { xs: 2.5, sm: 3 }, boxShadow: '0 30px 70px -50px rgba(11,18,32,.45)' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Presupuesto N° {p.idPresupuesto} · emitido el {dia(p.fechaEmision)}</Typography>
                  <Typography variant="h6">{p.odontologoNombre}</Typography>
                  <Typography variant="body2" color="text.secondary">{p.sucursalNombre}</Typography>
                </Box>
                <Chip label={estado.label} sx={{ bgcolor: estado.fondo, color: estado.color, fontWeight: 700, alignSelf: { xs: 'flex-start', sm: 'auto' } }} />
              </Stack>

              <Stack spacing={1} sx={{ mt: 2 }}>
                {p.tratamientos.map((t) => (
                  <Stack key={t.idTratamiento} direction="row" sx={{ justifyContent: 'space-between', p: 1.25, borderRadius: 2, bgcolor: '#f8fafc', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{t.nombre}{t.cantidad > 1 ? ` ×${t.cantidad}` : ''}</Typography>
                      {t.piezas.length > 0 && (
                        <Typography variant="body2" color="text.secondary">Piezas: {t.piezas.map((x) => x.pieza).join(', ')}</Typography>
                      )}
                    </Box>
                    <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{pesos.format(t.subtotal)}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2, justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 800 }}>{pesos.format(p.montoTotal)}</Typography>
                  {p.estado === 'PENDIENTE' && <Typography variant="body2" color="text.secondary">Válido hasta el {dia(p.fechaVencimiento)}</Typography>}
                  {p.estado === 'ACEPTADO' && (
                    <Box sx={{ mt: 1, minWidth: 240 }}>
                      <LinearProgress variant="determinate" value={avance} sx={{ height: 8, borderRadius: 4 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                        Pagado {pesos.format(p.totalAbonado)} · Saldo <strong>{pesos.format(p.saldoPendiente)}</strong>
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                  <Button startIcon={<PrintOutlinedIcon />} onClick={() => imprimirPresupuesto(p)}>Imprimir</Button>
                  {p.estado === 'PENDIENTE' && (
                    <>
                      <Button variant="outlined" color="error" startIcon={<CloseRoundedIcon />} onClick={() => { setRespuesta({ p, estado: 'RECHAZADO' }); setErrorRespuesta('') }}>Rechazar</Button>
                      <Button variant="contained" startIcon={<CheckRoundedIcon />} onClick={() => { setRespuesta({ p, estado: 'ACEPTADO' }); setErrorRespuesta('') }} sx={{ background: GRADIENT }}>Aceptar</Button>
                    </>
                  )}
                  {p.estado === 'ACEPTADO' && Number(p.saldoPendiente) > 0 && (
                    <Button variant="contained" startIcon={<PaymentsOutlinedIcon />} onClick={() => navigate('/portal/pagos')} sx={{ background: GRADIENT }}>Ir a pagar</Button>
                  )}
                </Stack>
              </Stack>
            </Card>
          )
        })}
      </Stack>

      <Dialog open={respuesta !== null} onClose={() => !guardando && setRespuesta(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{respuesta?.estado === 'ACEPTADO' ? '¿Aceptar este presupuesto?' : '¿Rechazar este presupuesto?'}</DialogTitle>
        <DialogContent>
          {errorRespuesta && <Alert severity="error" sx={{ mb: 2 }}>{errorRespuesta}</Alert>}
          {respuesta && (
            <Typography>
              Presupuesto N° {respuesta.p.idPresupuesto} por {pesos.format(respuesta.p.montoTotal)}.{' '}
              {respuesta.estado === 'ACEPTADO'
                ? 'Al aceptarlo podrás abonar en la clínica o desde tu portal.'
                : 'Si cambias de opinión, conversa con tu odontólogo para que emita uno nuevo.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setRespuesta(null)} disabled={guardando}>Volver</Button>
          <Button variant="contained" color={respuesta?.estado === 'ACEPTADO' ? 'primary' : 'error'} onClick={() => void responder()} disabled={guardando}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : respuesta?.estado === 'ACEPTADO' ? 'Aceptar' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={4000} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>{aviso}</Alert>
      </Snackbar>
    </Box>
  )
}

export default MisPresupuestos
