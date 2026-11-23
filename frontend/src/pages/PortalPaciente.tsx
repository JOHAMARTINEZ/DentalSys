import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'

import { apiGet, mensajeError } from '../services/api'

/* =========================================================
   INICIO DEL PORTAL DEL PACIENTE
   Datos de GET /api/portal/resumen: próxima cita,
   presupuestos por responder, saldo y última atención.
========================================================= */

const GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)'
const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

interface Cita {
  idCita: number
  fechaHora: string
  estado: string
  tipoAtencion: string | null
  odontologoNombre: string
  especialidad: string
  sucursalNombre: string
  sucursalDireccion: string
}

interface Resumen {
  nombres: string
  proximaCita: Cita | null
  citasProximas: number
  presupuestosPorResponder: number
  saldoPendiente: number
  ultimaAtencion: string | null
  atencionesCerradas: number
}

function Acceso({ icono, titulo, texto, onClick, destacado }: {
  icono: ReactNode
  titulo: string
  texto: string
  onClick: () => void
  destacado?: string
}) {
  return (
    <Card
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        display: 'block',
        p: 2.5,
        bgcolor: '#fff',
        border: '1px solid #e6eaf2',
        borderRadius: 5,
        transition: 'all .2s',
        '&:hover, &:focus-visible': { borderColor: '#93c5fd', transform: 'translateY(-2px)', boxShadow: '0 18px 40px -28px rgba(37,99,235,.6)' },
      }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ width: 46, height: 46, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: '#eef4ff', color: '#2563eb' }}>{icono}</Box>
        {destacado && <Chip size="small" label={destacado} sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }} />}
      </Stack>
      <Typography sx={{ mt: 2, fontWeight: 800 }}>{titulo}</Typography>
      <Typography variant="body2" color="text.secondary">{texto}</Typography>
    </Card>
  )
}

function PortalPaciente() {
  const navigate = useNavigate()
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      setResumen(await apiGet<Resumen>('/api/portal/resumen'))
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar tu información.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  const cita = resumen?.proximaCita
  const inicio = cita ? new Date(cita.fechaHora) : null

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      {/* ===== Próxima cita ===== */}
      <Card sx={{ p: { xs: 2.5, md: 3.5 }, boxShadow: '0 40px 80px -50px rgba(11,18,32,.45)' }}>
        {cargando ? <Skeleton variant="rounded" height={110} /> : cita && inicio ? (
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: { md: 'center' } }}>
            <Box sx={{ minWidth: 120, textAlign: 'center', py: 2, px: 2, borderRadius: 4, color: '#fff', background: GRADIENT, alignSelf: { xs: 'flex-start', md: 'auto' } }}>
              <Typography sx={{ fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{inicio.toLocaleDateString('es-CL', { weekday: 'long' })}</Typography>
              <Typography sx={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.05 }}>{inicio.getDate()}</Typography>
              <Typography sx={{ fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{inicio.toLocaleDateString('es-CL', { month: 'long' })}</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="overline" color="primary">Tu próxima cita</Typography>
              <Typography variant="h5">
                {inicio.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} · {cita.tipoAtencion || 'Atención dental'}
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 1, color: 'text.secondary' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <PersonOutlineRoundedIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">{cita.odontologoNombre} · {cita.especialidad}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <PlaceOutlinedIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">{cita.sucursalNombre} · {cita.sucursalDireccion}</Typography>
                </Stack>
              </Stack>
              <Chip size="small" sx={{ mt: 1.5 }} label={cita.estado === 'CONFIRMADA' ? 'Confirmada por la clínica' : 'Reservada'} color={cita.estado === 'CONFIRMADA' ? 'primary' : 'warning'} variant="outlined" />
            </Box>
            <Button endIcon={<ArrowForwardRoundedIcon />} onClick={() => navigate('/portal/citas')} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
              {resumen && resumen.citasProximas > 1 ? `Ver tus ${resumen.citasProximas} citas` : 'Ver mis citas'}
            </Button>
          </Stack>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <Box sx={{ width: 64, height: 64, borderRadius: 4, display: 'grid', placeItems: 'center', bgcolor: '#eef4ff', color: '#2563eb' }}>
              <EventAvailableOutlinedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">No tienes horas agendadas</Typography>
              <Typography color="text.secondary">Reserva tu próxima atención en pocos pasos.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate('/portal/reservar-cita')} sx={{ background: GRADIENT, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
              Reservar hora
            </Button>
          </Stack>
        )}
      </Card>

      {/* ===== Indicadores ===== */}
      {!cargando && resumen && (resumen.presupuestosPorResponder > 0 || Number(resumen.saldoPendiente) > 0) && (
        <Grid container spacing={2}>
          {resumen.presupuestosPorResponder > 0 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => navigate('/portal/presupuestos')}>Revisar</Button>}>
                Tienes {resumen.presupuestosPorResponder} presupuesto(s) esperando tu respuesta.
              </Alert>
            </Grid>
          )}
          {Number(resumen.saldoPendiente) > 0 && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Alert severity="warning" action={<Button color="inherit" size="small" onClick={() => navigate('/portal/pagos')}>Ver detalle</Button>}>
                Saldo pendiente: <strong>{pesos.format(resumen.saldoPendiente)}</strong>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* ===== Accesos ===== */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Acceso icono={<CalendarMonthOutlinedIcon />} titulo="Mis citas" texto="Próximas horas, historial y cancelaciones." onClick={() => navigate('/portal/citas')}
            destacado={resumen && resumen.citasProximas > 0 ? `${resumen.citasProximas} próxima(s)` : undefined} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Acceso icono={<HistoryOutlinedIcon />} titulo="Mis atenciones" texto={resumen?.ultimaAtencion ? `Última: ${new Date(resumen.ultimaAtencion).toLocaleDateString('es-CL')}` : 'Diagnósticos e indicaciones.'} onClick={() => navigate('/portal/atenciones')} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Acceso icono={<RequestQuoteOutlinedIcon />} titulo="Mis presupuestos" texto="Revisa y responde tus presupuestos." onClick={() => navigate('/portal/presupuestos')}
            destacado={resumen && resumen.presupuestosPorResponder > 0 ? 'Por responder' : undefined} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Acceso icono={<PaymentsOutlinedIcon />} titulo="Mis pagos" texto="Saldos, pagos y comprobantes." onClick={() => navigate('/portal/pagos')}
            destacado={resumen && Number(resumen.saldoPendiente) > 0 ? 'Saldo pendiente' : undefined} />
        </Grid>
      </Grid>
    </Stack>
  )
}

export default PortalPaciente
