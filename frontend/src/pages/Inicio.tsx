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

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'

import { apiGet, getRol, getUsuarioSesion, mensajeError } from '../services/api'
import type { Rol } from '../services/api'

/* =========================================================
   INICIO DEL PORTAL DE GESTIÓN
   Todos los números vienen de GET /api/dashboard/resumen
   (calculados desde la base de datos, nada inventado).
   Cada rol ve las tarjetas y accesos que le corresponden.
========================================================= */

const C = {
  navy: '#0a1628',
  navy2: '#10264a',
  blue: '#2563eb',
  cyan: '#22d3ee',
  muted: '#526077',
  line: '#e6eaf2',
  tint: '#eef4ff',
}

const GRADIENT = `linear-gradient(135deg, ${C.blue} 0%, ${C.cyan} 100%)`

interface CitaDelDia {
  idCita: number
  fechaHora: string
  fechaHoraFin: string
  paciente: string
  odontologo: string
  sucursal: string
  tipoAtencion: string | null
  estado: string
}

interface Resumen {
  pacientesActivos: number
  citasHoy: number
  citasPorConfirmar: number
  atencionesHoy: number
  presupuestosPendientes: number
  odontologosActivos: number
  usuariosActivos: number | null
  citasDelDia: CitaDelDia[]
}

type ClaveNumero =
  | 'pacientesActivos'
  | 'citasHoy'
  | 'citasPorConfirmar'
  | 'atencionesHoy'
  | 'presupuestosPendientes'
  | 'odontologosActivos'
  | 'usuariosActivos'

interface Tarjeta {
  clave: ClaveNumero
  titulo: string
  detalle: string
  icono: ReactNode
}

const TARJETAS: Record<ClaveNumero, Tarjeta> = {
  pacientesActivos: {
    clave: 'pacientesActivos',
    titulo: 'Pacientes activos',
    detalle: 'Registrados en la clínica',
    icono: <PeopleAltOutlinedIcon />,
  },
  citasHoy: {
    clave: 'citasHoy',
    titulo: 'Citas de hoy',
    detalle: 'Sin contar canceladas',
    icono: <CalendarMonthOutlinedIcon />,
  },
  citasPorConfirmar: {
    clave: 'citasPorConfirmar',
    titulo: 'Por confirmar',
    detalle: 'Citas futuras reservadas',
    icono: <PendingActionsOutlinedIcon />,
  },
  atencionesHoy: {
    clave: 'atencionesHoy',
    titulo: 'Atenciones de hoy',
    detalle: 'Registradas en fichas',
    icono: <MedicalServicesOutlinedIcon />,
  },
  presupuestosPendientes: {
    clave: 'presupuestosPendientes',
    titulo: 'Presupuestos pendientes',
    detalle: 'Esperando respuesta',
    icono: <RequestQuoteOutlinedIcon />,
  },
  odontologosActivos: {
    clave: 'odontologosActivos',
    titulo: 'Odontólogos activos',
    detalle: 'Disponibles para agendar',
    icono: <EventAvailableOutlinedIcon />,
  },
  usuariosActivos: {
    clave: 'usuariosActivos',
    titulo: 'Usuarios activos',
    detalle: 'Cuentas habilitadas',
    icono: <ManageAccountsOutlinedIcon />,
  },
}

// Qué tarjetas ve cada rol
const TARJETAS_POR_ROL: Record<Exclude<Rol, 'PACIENTE'>, ClaveNumero[]> = {
  ADMIN: ['usuariosActivos', 'odontologosActivos', 'pacientesActivos', 'citasHoy'],
  RECEPCIONISTA: ['citasHoy', 'citasPorConfirmar', 'pacientesActivos', 'presupuestosPendientes'],
  ODONTOLOGO: ['citasHoy', 'atencionesHoy', 'presupuestosPendientes', 'pacientesActivos'],
}

interface Acceso {
  titulo: string
  detalle: string
  ruta: string
  icono: ReactNode
  roles: Rol[]
}

const ACCESOS: Acceso[] = [
  {
    titulo: 'Agenda',
    detalle: 'Revisar, confirmar y crear citas',
    ruta: '/gestion/agenda',
    icono: <CalendarMonthOutlinedIcon />,
    roles: ['ADMIN', 'RECEPCIONISTA', 'ODONTOLOGO'],
  },
  {
    titulo: 'Pacientes',
    detalle: 'Registrar y actualizar datos',
    ruta: '/gestion/pacientes',
    icono: <PeopleAltOutlinedIcon />,
    roles: ['ADMIN', 'RECEPCIONISTA', 'ODONTOLOGO'],
  },
  {
    titulo: 'Ficha clínica',
    detalle: 'Antecedentes y atenciones',
    ruta: '/gestion/ficha-clinica',
    icono: <DescriptionOutlinedIcon />,
    roles: ['ODONTOLOGO'],
  },
  {
    titulo: 'Presupuestos',
    detalle: 'Tratamientos, abonos y saldos',
    ruta: '/gestion/presupuestos',
    icono: <RequestQuoteOutlinedIcon />,
    roles: ['ODONTOLOGO', 'RECEPCIONISTA'],
  },
  {
    titulo: 'Usuarios',
    detalle: 'Cuentas del personal',
    ruta: '/gestion/usuarios',
    icono: <ManageAccountsOutlinedIcon />,
    roles: ['ADMIN'],
  },
]

const ESTADO_CITA: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' }> = {
  RESERVADA: { label: 'Reservada', color: 'warning' },
  CONFIRMADA: { label: 'Confirmada', color: 'primary' },
  COMPLETADA: { label: 'Completada', color: 'success' },
  CANCELADA: { label: 'Cancelada', color: 'default' },
  NO_ASISTIO: { label: 'No asistió', color: 'error' },
}

function hora(fecha: string): string {
  return new Date(fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}

function saludo(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

function Inicio() {
  const navigate = useNavigate()
  const rol = getRol()
  const usuario = getUsuarioSesion()

  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      setResumen(await apiGet<Resumen>('/api/dashboard/resumen'))
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar el resumen.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // Carga inicial del resumen
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  const rolGestion = rol && rol !== 'PACIENTE' ? rol : 'RECEPCIONISTA'
  const tarjetas = TARJETAS_POR_ROL[rolGestion].map((clave) => TARJETAS[clave])
  const accesos = ACCESOS.filter((acceso) => rol !== null && acceso.roles.includes(rol))

  const fechaHoy = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Box>
      {/* ===== Bienvenida ===== */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 5,
          p: { xs: 3, sm: 4 },
          mb: 3,
          color: '#fff',
          background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navy2} 70%)`,
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            right: -80,
            top: -140,
            background: GRADIENT,
            opacity: 0.25,
            filter: 'blur(30px)',
          }}
        />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ position: 'relative', justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.65)', textTransform: 'capitalize' }}>
              {fechaHoy}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5, fontSize: { xs: '1.6rem', sm: '2.1rem' } }}>
              {saludo()}, {usuario.nombres || usuario.username || 'equipo'}
            </Typography>
            <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.72)', maxWidth: 560 }}>
              {rol === 'ODONTOLOGO'
                ? 'Estas son tus citas y pendientes de hoy.'
                : rol === 'ADMIN'
                  ? 'Resumen general del sistema y de la clínica.'
                  : 'Esto es lo que está pasando hoy en la clínica.'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/gestion/agenda')}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ background: GRADIENT, alignSelf: { xs: 'flex-start', sm: 'center' }, whiteSpace: 'nowrap' }}
          >
            Ir a la agenda
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => void cargar()}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* ===== Tarjetas con números ===== */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {tarjetas.map((tarjeta) => (
          <Grid key={tarjeta.clave} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ p: 2.5, height: '100%' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {tarjeta.titulo}
                  </Typography>
                  {cargando ? (
                    <Skeleton width={60} height={52} />
                  ) : (
                    <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.3 }}>
                      {resumen ? (resumen[tarjeta.clave] ?? 0) : '—'}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {tarjeta.detalle}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 3,
                    display: 'grid',
                    placeItems: 'center',
                    color: C.blue,
                    backgroundColor: C.tint,
                  }}
                >
                  {tarjeta.icono}
                </Box>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {/* ===== Agenda de hoy ===== */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6">
                  {rol === 'ODONTOLOGO' ? 'Mis citas de hoy' : 'Citas de hoy'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ordenadas por hora
                </Typography>
              </Box>
              <Button size="small" startIcon={<RefreshRoundedIcon />} onClick={() => void cargar()} disabled={cargando}>
                Actualizar
              </Button>
            </Stack>

            {cargando && (
              <Stack spacing={1.5}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} variant="rounded" height={64} />
                ))}
              </Stack>
            )}

            {!cargando && resumen && resumen.citasDelDia.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <EventBusyOutlinedIcon sx={{ fontSize: 44, color: '#c3cbe0' }} />
                <Typography sx={{ mt: 1, fontWeight: 600 }}>No hay citas para hoy</Typography>
                <Typography variant="body2">Las nuevas reservas aparecerán aquí.</Typography>
              </Box>
            )}

            {!cargando && resumen && resumen.citasDelDia.length > 0 && (
              <Stack spacing={1.25}>
                {resumen.citasDelDia.map((cita) => {
                  const estado = ESTADO_CITA[cita.estado] ?? { label: cita.estado, color: 'default' as const }
                  return (
                    <Box
                      key={cita.idCita}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 3,
                        border: `1px solid ${C.line}`,
                        transition: 'border-color .2s, background-color .2s',
                        '&:hover': { borderColor: '#c7d7fe', backgroundColor: '#fafcff' },
                      }}
                    >
                      <Box
                        sx={{
                          minWidth: 64,
                          textAlign: 'center',
                          py: 0.75,
                          borderRadius: 2,
                          backgroundColor: C.tint,
                          color: C.blue,
                          fontWeight: 800,
                        }}
                      >
                        {hora(cita.fechaHora)}
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700 }} noWrap>
                          {cita.paciente}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {cita.tipoAtencion || 'Atención dental'}
                          {rol !== 'ODONTOLOGO' && ` · ${cita.odontologo}`}
                          {` · ${cita.sucursal}`}
                        </Typography>
                      </Box>
                      <Chip size="small" label={estado.label} color={estado.color} variant="outlined" />
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Card>
        </Grid>

        {/* ===== Accesos rápidos ===== */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
            <Typography variant="h6">Accesos rápidos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Según tu rol
            </Typography>
            <Stack spacing={1.25}>
              {accesos.map((acceso) => (
                <Box
                  key={acceso.ruta}
                  component="button"
                  type="button"
                  onClick={() => navigate(acceso.ruta)}
                  sx={{
                    all: 'unset',
                    boxSizing: 'border-box',
                    width: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 3,
                    border: `1px solid ${C.line}`,
                    transition: 'all .2s',
                    '&:hover, &:focus-visible': {
                      borderColor: C.blue,
                      backgroundColor: '#fafcff',
                      '& .flecha': { transform: 'translateX(3px)', color: C.blue },
                    },
                  }}
                >
                  <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: '#fff', background: GRADIENT }}>
                    {acceso.icono}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{acceso.titulo}</Typography>
                    <Typography variant="caption" color="text.secondary">{acceso.detalle}</Typography>
                  </Box>
                  <ArrowForwardRoundedIcon className="flecha" fontSize="small" sx={{ color: C.muted, transition: 'all .2s' }} />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Inicio
