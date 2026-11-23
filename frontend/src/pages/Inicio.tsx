import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import MedicalInformationOutlinedIcon from '@mui/icons-material/MedicalInformationOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'

import { apiGet, getRol, getUsuarioSesion, mensajeError } from '../services/api'
import type { Rol } from '../services/api'
import { temaDeRol } from '../components/layout/temaRol'

/* =========================================================
   INICIO DEL PORTAL DE GESTIÓN
   Todos los números vienen de GET /api/dashboard/resumen
   (calculados desde la base de datos, nada inventado).
   Cada rol tiene su propio panel:
   - Odontólogo: próximo paciente y avance de su jornada.
   - Recepción: citas del día por estado y tareas pendientes.
   - Administración: actividad del día, carga por odontólogo
     y accesos de control.
========================================================= */

type RolGestion = Exclude<Rol, 'PACIENTE'>

const C = {
  navy: '#0a1628',
  navy2: '#10264a',
  muted: '#526077',
  line: '#e6eaf2',
}

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
  titulo: string
  detalle: string
  icono: ReactNode
  ruta: string
}

const TARJETAS: Record<ClaveNumero, Tarjeta> = {
  pacientesActivos: { titulo: 'Pacientes activos', detalle: 'Registrados en la clínica', icono: <PeopleAltOutlinedIcon />, ruta: '/gestion/pacientes' },
  citasHoy: { titulo: 'Citas de hoy', detalle: 'Sin contar canceladas', icono: <CalendarMonthOutlinedIcon />, ruta: '/gestion/agenda' },
  citasPorConfirmar: { titulo: 'Por confirmar', detalle: 'Citas futuras reservadas', icono: <PendingActionsOutlinedIcon />, ruta: '/gestion/agenda' },
  atencionesHoy: { titulo: 'Atenciones de hoy', detalle: 'Registradas en fichas', icono: <MedicalServicesOutlinedIcon />, ruta: '/gestion/ficha-clinica' },
  presupuestosPendientes: { titulo: 'Presupuestos pendientes', detalle: 'Esperando respuesta', icono: <RequestQuoteOutlinedIcon />, ruta: '/gestion/presupuestos' },
  odontologosActivos: { titulo: 'Odontólogos activos', detalle: 'Disponibles para agendar', icono: <EventAvailableOutlinedIcon />, ruta: '/gestion/horarios' },
  usuariosActivos: { titulo: 'Usuarios activos', detalle: 'Cuentas habilitadas', icono: <ManageAccountsOutlinedIcon />, ruta: '/gestion/usuarios' },
}

const TARJETAS_POR_ROL: Record<RolGestion, ClaveNumero[]> = {
  ADMIN: ['usuariosActivos', 'odontologosActivos', 'pacientesActivos', 'citasHoy'],
  RECEPCIONISTA: ['citasHoy', 'citasPorConfirmar', 'presupuestosPendientes', 'pacientesActivos'],
  ODONTOLOGO: ['citasHoy', 'atencionesHoy', 'presupuestosPendientes', 'pacientesActivos'],
}

interface Acceso {
  titulo: string
  detalle: string
  ruta: string
  icono: ReactNode
}

const ACCESOS: Record<RolGestion, Acceso[]> = {
  ADMIN: [
    { titulo: 'Usuarios', detalle: 'Cuentas y permisos del personal', ruta: '/gestion/usuarios', icono: <ManageAccountsOutlinedIcon /> },
    { titulo: 'Horarios', detalle: 'Tramos de atención y bloqueos', ruta: '/gestion/horarios', icono: <ScheduleOutlinedIcon /> },
    { titulo: 'Tratamientos', detalle: 'Catálogo y valores de referencia', ruta: '/gestion/tratamientos', icono: <MedicalInformationOutlinedIcon /> },
    { titulo: 'Pagos', detalle: 'Caja, comprobantes y anulaciones', ruta: '/gestion/pagos', icono: <PaymentsOutlinedIcon /> },
  ],
  RECEPCIONISTA: [
    { titulo: 'Agenda', detalle: 'Agendar, confirmar y reprogramar', ruta: '/gestion/agenda', icono: <CalendarMonthOutlinedIcon /> },
    { titulo: 'Pacientes', detalle: 'Registrar y actualizar datos', ruta: '/gestion/pacientes', icono: <PeopleAltOutlinedIcon /> },
    { titulo: 'Presupuestos', detalle: 'Respuestas y abonos', ruta: '/gestion/presupuestos', icono: <RequestQuoteOutlinedIcon /> },
    { titulo: 'Pagos', detalle: 'Cobros y comprobantes', ruta: '/gestion/pagos', icono: <PaymentsOutlinedIcon /> },
  ],
  ODONTOLOGO: [
    { titulo: 'Ficha clínica', detalle: 'Antecedentes y atenciones', ruta: '/gestion/ficha-clinica', icono: <DescriptionOutlinedIcon /> },
    { titulo: 'Mi agenda', detalle: 'Citas del día y de la semana', ruta: '/gestion/agenda', icono: <CalendarMonthOutlinedIcon /> },
    { titulo: 'Presupuestos', detalle: 'Planes de tratamiento', ruta: '/gestion/presupuestos', icono: <RequestQuoteOutlinedIcon /> },
    { titulo: 'Mi horario', detalle: 'Tramos y bloqueos', ruta: '/gestion/horarios', icono: <ScheduleOutlinedIcon /> },
  ],
}

const ESTADO_CITA: Record<string, { label: string; color: string; fondo: string }> = {
  RESERVADA: { label: 'Por confirmar', color: '#b45309', fondo: '#fef3c7' },
  CONFIRMADA: { label: 'Confirmada', color: '#1d4ed8', fondo: '#dbeafe' },
  COMPLETADA: { label: 'Completada', color: '#047857', fondo: '#d1fae5' },
  CANCELADA: { label: 'Cancelada', color: '#475569', fondo: '#e2e8f0' },
  NO_ASISTIO: { label: 'No asistió', color: '#b91c1c', fondo: '#fee2e2' },
}

const CERRADAS = ['COMPLETADA', 'CANCELADA', 'NO_ASISTIO']

function estadoDe(estado: string) {
  return ESTADO_CITA[estado] ?? { label: estado, color: C.muted, fondo: '#f1f5f9' }
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

/** "En 25 min", "En 2 h 10 min", "En curso" o "Hace 15 min" */
function relativo(inicio: string, fin: string, ahora: number): string {
  const desde = new Date(inicio).getTime()
  const hasta = new Date(fin).getTime()
  if (ahora >= desde && ahora < hasta) return 'En curso'
  const minutos = Math.round((desde - ahora) / 60000)
  if (minutos < 0) return `Hace ${Math.abs(minutos)} min`
  if (minutos < 60) return `En ${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m ? `En ${h} h ${m} min` : `En ${h} h`
}

const barraRol = {
  height: 8,
  borderRadius: 99,
  bgcolor: 'var(--rol-tint)',
  '& .MuiLinearProgress-bar': { borderRadius: 99, background: 'var(--rol-gradiente)' },
}

/* ---------- Piezas reutilizables ---------- */

function EstadoChip({ estado }: { estado: string }) {
  const e = estadoDe(estado)
  return <Chip size="small" label={e.label} sx={{ bgcolor: e.fondo, color: e.color, fontWeight: 700 }} />
}

function SinCitas({ texto }: { texto: string }) {
  return (
    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
      <EventBusyOutlinedIcon sx={{ fontSize: 44, color: '#c3cbe0', mx: 'auto' }} />
      <Typography sx={{ mt: 1, fontWeight: 600 }}>No hay citas para hoy</Typography>
      <Typography variant="body2">{texto}</Typography>
    </Box>
  )
}

function FilaCita({ cita, mostrarOdontologo, atenuar }: { cita: CitaDelDia; mostrarOdontologo: boolean; atenuar?: boolean }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1.25, sm: 2 },
        p: 1.5,
        borderRadius: 3,
        border: `1px solid ${C.line}`,
        backgroundColor: '#fff',
        opacity: atenuar ? 0.6 : 1,
        transition: 'border-color .2s, background-color .2s, transform .2s',
        '&:hover': { borderColor: 'primary.light', backgroundColor: '#fbfcff', transform: 'translateX(2px)' },
      }}
    >
      <Box
        sx={{
          minWidth: 60,
          textAlign: 'center',
          py: 0.75,
          borderRadius: 2,
          backgroundColor: 'var(--rol-tint)',
          color: 'var(--rol-dark)',
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
          {mostrarOdontologo && ` · ${cita.odontologo}`}
          {` · ${cita.sucursal}`}
        </Typography>
      </Box>
      <EstadoChip estado={cita.estado} />
    </Box>
  )
}

function AccesosRapidos({ accesos, titulo }: { accesos: Acceso[]; titulo: string }) {
  const navigate = useNavigate()
  return (
    <Card sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
      <Typography variant="h6">{titulo}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Accesos de tu perfil
      </Typography>
      <Stack spacing={1.25}>
        {accesos.map((acceso) => (
          <Box
            key={acceso.ruta + acceso.titulo}
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
                borderColor: 'primary.main',
                backgroundColor: '#fbfcff',
                '& .flecha': { transform: 'translateX(3px)', color: 'primary.main' },
              },
            }}
          >
            <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: '#fff', background: 'var(--rol-gradiente)', flexShrink: 0 }}>
              {acceso.icono}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{acceso.titulo}</Typography>
              <Typography variant="caption" color="text.secondary">{acceso.detalle}</Typography>
            </Box>
            <ArrowForwardRoundedIcon className="flecha" fontSize="small" sx={{ color: C.muted, transition: 'all .2s' }} />
          </Box>
        ))}
      </Stack>
    </Card>
  )
}

/* ---------- Panel del odontólogo ---------- */

function PanelOdontologo({ citas, cargando, ahora }: { citas: CitaDelDia[]; cargando: boolean; ahora: number }) {
  const navigate = useNavigate()
  const vigentes = citas.filter((c) => c.estado !== 'CANCELADA')
  const atendidas = vigentes.filter((c) => c.estado === 'COMPLETADA' || c.estado === 'NO_ASISTIO').length
  const avance = vigentes.length ? Math.round((atendidas / vigentes.length) * 100) : 0

  // Próximo paciente: la primera cita aún abierta que no ha terminado
  const proxima = vigentes.find(
    (c) => !CERRADAS.includes(c.estado) && new Date(c.fechaHoraFin).getTime() > ahora,
  )

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={2.5}>
          {/* Próximo paciente */}
          <Card sx={{ p: { xs: 2.5, sm: 3 }, position: 'relative', overflow: 'hidden' }}>
            <Box aria-hidden sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: 'var(--rol-gradiente)' }} />
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: '0.1em' }}>
              Próximo paciente
            </Typography>
            {cargando ? (
              <Skeleton variant="rounded" height={84} sx={{ mt: 1 }} />
            ) : proxima ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1, alignItems: { sm: 'center' } }}>
                <Box
                  sx={{
                    minWidth: 96,
                    textAlign: 'center',
                    py: 1.25,
                    px: 1.5,
                    borderRadius: 3,
                    color: '#fff',
                    background: 'var(--rol-gradiente)',
                    animation: 'md-pulso 2.4s ease-in-out infinite',
                    alignSelf: { xs: 'flex-start', sm: 'center' },
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', lineHeight: 1.1 }}>{hora(proxima.fechaHora)}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.92, fontWeight: 600 }}>
                    {relativo(proxima.fechaHora, proxima.fechaHoraFin, ahora)}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="h6" noWrap>{proxima.paciente}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {proxima.tipoAtencion || 'Atención dental'}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
                    <EstadoChip estado={proxima.estado} />
                    <Chip size="small" variant="outlined" icon={<PlaceOutlinedIcon />} label={proxima.sucursal} />
                  </Stack>
                </Box>
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={() => navigate('/gestion/agenda')}
                  sx={{ background: 'var(--rol-gradiente)', alignSelf: { xs: 'stretch', sm: 'center' }, whiteSpace: 'nowrap' }}
                >
                  Atender desde la agenda
                </Button>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1.5} sx={{ mt: 1, alignItems: 'center' }}>
                <CheckCircleRoundedIcon sx={{ color: 'success.main', fontSize: 36 }} />
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>
                    {vigentes.length ? 'Jornada completada' : 'Sin pacientes agendados hoy'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vigentes.length
                      ? 'No te quedan citas pendientes por hoy.'
                      : 'Puedes revisar fichas clínicas o preparar presupuestos.'}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Card>

          {/* Jornada */}
          <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end', mb: 1.5 }}>
              <Box>
                <Typography variant="h6">Mi jornada</Typography>
                <Typography variant="body2" color="text.secondary">
                  {vigentes.length ? `${atendidas} de ${vigentes.length} citas atendidas` : 'Ordenada por hora'}
                </Typography>
              </Box>
              {vigentes.length > 0 && (
                <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>{avance}%</Typography>
              )}
            </Stack>
            {vigentes.length > 0 && <LinearProgress variant="determinate" value={avance} sx={{ ...barraRol, mb: 2.5 }} />}

            {cargando ? (
              <Stack spacing={1.5}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={60} />)}</Stack>
            ) : citas.length === 0 ? (
              <SinCitas texto="Cuando recepción agende pacientes, aparecerán aquí." />
            ) : (
              <Box sx={{ position: 'relative', pl: 3 }}>
                <Box aria-hidden sx={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, bgcolor: C.line, borderRadius: 1 }} />
                <Stack spacing={1.25}>
                  {citas.map((cita) => {
                    const cerrada = CERRADAS.includes(cita.estado)
                    const esProxima = proxima?.idCita === cita.idCita
                    return (
                      <Box key={cita.idCita} sx={{ position: 'relative' }}>
                        <Box
                          aria-hidden
                          sx={{
                            position: 'absolute',
                            left: -20,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            border: '2px solid #fff',
                            boxShadow: `0 0 0 2px ${esProxima ? 'var(--rol-main)' : cerrada ? '#cbd5e1' : C.line}`,
                            bgcolor: esProxima ? 'var(--rol-main)' : cerrada ? '#cbd5e1' : '#fff',
                          }}
                        />
                        <FilaCita cita={cita} mostrarOdontologo={false} atenuar={cerrada} />
                      </Box>
                    )
                  })}
                </Stack>
              </Box>
            )}
          </Card>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <AccesosRapidos accesos={ACCESOS.ODONTOLOGO} titulo="Mi consulta" />
      </Grid>
    </Grid>
  )
}

/* ---------- Panel de recepción ---------- */

const FILTROS_RECEPCION = [
  { clave: 'TODAS', label: 'Todas' },
  { clave: 'RESERVADA', label: 'Por confirmar' },
  { clave: 'CONFIRMADA', label: 'Confirmadas' },
  { clave: 'COMPLETADA', label: 'Completadas' },
] as const

type FiltroRecepcion = (typeof FILTROS_RECEPCION)[number]['clave']

function PanelRecepcion({ resumen, citas, cargando }: { resumen: Resumen | null; citas: CitaDelDia[]; cargando: boolean }) {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<FiltroRecepcion>('TODAS')

  const conteo = (clave: FiltroRecepcion) => (clave === 'TODAS' ? citas.length : citas.filter((c) => c.estado === clave).length)
  const visibles = filtro === 'TODAS' ? citas : citas.filter((c) => c.estado === filtro)
  const porConfirmarHoy = citas.filter((c) => c.estado === 'RESERVADA').length
  const futurasPorConfirmar = resumen?.citasPorConfirmar ?? 0
  const presupuestos = resumen?.presupuestosPendientes ?? 0

  const pendientes = [
    {
      activo: porConfirmarHoy > 0,
      titulo: porConfirmarHoy === 1 ? '1 cita de hoy sin confirmar' : `${porConfirmarHoy} citas de hoy sin confirmar`,
      detalle: 'Contacta al paciente y confírmala en la agenda.',
      ruta: '/gestion/agenda',
    },
    {
      activo: futurasPorConfirmar > 0,
      titulo: futurasPorConfirmar === 1 ? '1 reserva próxima por confirmar' : `${futurasPorConfirmar} reservas próximas por confirmar`,
      detalle: 'Incluye las reservas hechas desde el portal.',
      ruta: '/gestion/agenda',
    },
    {
      activo: presupuestos > 0,
      titulo: presupuestos === 1 ? '1 presupuesto esperando respuesta' : `${presupuestos} presupuestos esperando respuesta`,
      detalle: 'Registra si el paciente aceptó o rechazó.',
      ruta: '/gestion/presupuestos',
    },
  ].filter((t) => t.activo)

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ p: { xs: 2.5, sm: 3 }, height: '100%' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 2 }}>
            <Box>
              <Typography variant="h6">Citas de hoy</Typography>
              <Typography variant="body2" color="text.secondary">Ordenadas por hora</Typography>
            </Box>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75 }}>
              {FILTROS_RECEPCION.map((f) => (
                <Chip
                  key={f.clave}
                  label={`${f.label} · ${conteo(f.clave)}`}
                  onClick={() => setFiltro(f.clave)}
                  color={filtro === f.clave ? 'primary' : 'default'}
                  variant={filtro === f.clave ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Stack>
          </Stack>

          {cargando ? (
            <Stack spacing={1.5}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={64} />)}</Stack>
          ) : citas.length === 0 ? (
            <SinCitas texto="Las nuevas reservas aparecerán aquí." />
          ) : visibles.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No hay citas con este estado.
            </Typography>
          ) : (
            <Stack spacing={1.25}>
              {visibles.map((cita) => (
                <FilaCita key={cita.idCita} cita={cita} mostrarOdontologo atenuar={cita.estado === 'CANCELADA'} />
              ))}
            </Stack>
          )}
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Stack spacing={2.5}>
          <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h6">Pendientes de recepción</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {cargando ? 'Revisando…' : pendientes.length ? 'Tareas por resolver' : 'Todo al día'}
            </Typography>
            {cargando ? (
              <Skeleton variant="rounded" height={90} />
            ) : pendientes.length === 0 ? (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 1.5, borderRadius: 3, bgcolor: '#ecfdf5' }}>
                <CheckCircleRoundedIcon sx={{ color: 'success.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#047857' }}>
                  No hay confirmaciones ni respuestas pendientes.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1.25}>
                {pendientes.map((t) => (
                  <Box
                    key={t.titulo}
                    component="button"
                    type="button"
                    onClick={() => navigate(t.ruta)}
                    sx={{
                      all: 'unset',
                      boxSizing: 'border-box',
                      width: '100%',
                      cursor: 'pointer',
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor: '#fffbeb',
                      border: '1px solid #fde68a',
                      transition: 'all .2s',
                      '&:hover, &:focus-visible': { borderColor: '#f59e0b', transform: 'translateY(-1px)' },
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>{t.titulo}</Typography>
                    <Typography variant="caption" sx={{ color: '#a16207' }}>{t.detalle}</Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Card>
          <AccesosRapidos accesos={ACCESOS.RECEPCIONISTA} titulo="Recepción" />
        </Stack>
      </Grid>
    </Grid>
  )
}

/* ---------- Panel de administración ---------- */

function PanelAdmin({ citas, cargando }: { citas: CitaDelDia[]; cargando: boolean }) {
  const total = citas.length
  const segmentos = Object.entries(ESTADO_CITA)
    .map(([clave, e]) => ({ clave, ...e, cantidad: citas.filter((c) => c.estado === clave).length }))
    .filter((s) => s.cantidad > 0)

  // Citas vigentes de hoy por odontólogo
  const porOdontologo = Object.entries(
    citas
      .filter((c) => c.estado !== 'CANCELADA')
      .reduce<Record<string, number>>((acc, c) => {
        acc[c.odontologo] = (acc[c.odontologo] ?? 0) + 1
        return acc
      }, {}),
  ).sort((a, b) => b[1] - a[1])
  const maximo = porOdontologo.length ? porOdontologo[0][1] : 0

  return (
    <Grid container spacing={2.5}>
      <Grid size={{ xs: 12, lg: 8 }}>
        <Stack spacing={2.5}>
          <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h6">Actividad de hoy</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {total === 1 ? 'Estado de la cita agendada para hoy' : `Estado de las ${total} citas agendadas para hoy`}
            </Typography>
            {cargando ? (
              <Skeleton variant="rounded" height={60} />
            ) : total === 0 ? (
              <SinCitas texto="Cuando se agenden citas para hoy verás aquí su estado." />
            ) : (
              <>
                <Box sx={{ display: 'flex', height: 14, borderRadius: 99, overflow: 'hidden', mb: 2, gap: '2px' }}>
                  {segmentos.map((s) => (
                    <Tooltip key={s.clave} title={`${s.label}: ${s.cantidad}`}>
                      <Box sx={{ flexGrow: s.cantidad, bgcolor: s.color, transition: 'flex-grow .4s ease' }} />
                    </Tooltip>
                  ))}
                </Box>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {segmentos.map((s) => (
                    <Chip key={s.clave} size="small" label={`${s.label}: ${s.cantidad}`} sx={{ bgcolor: s.fondo, color: s.color, fontWeight: 700 }} />
                  ))}
                </Stack>
              </>
            )}
          </Card>

          <Card sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h6">Carga por odontólogo</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Citas vigentes de hoy
            </Typography>
            {cargando ? (
              <Stack spacing={1.25}>{[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={34} />)}</Stack>
            ) : porOdontologo.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin citas vigentes hoy.</Typography>
            ) : (
              <Stack spacing={1.5}>
                {porOdontologo.map(([nombre, cantidad]) => (
                  <Box key={nombre}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{nombre}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{cantidad}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={maximo ? (cantidad / maximo) * 100 : 0} sx={barraRol} />
                  </Box>
                ))}
              </Stack>
            )}
          </Card>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <AccesosRapidos accesos={ACCESOS.ADMIN} titulo="Administración" />
      </Grid>
    </Grid>
  )
}

/* ---------- Página ---------- */

const MENSAJE: Record<RolGestion, string> = {
  ADMIN: 'Resumen general del sistema y de la clínica.',
  RECEPCIONISTA: 'Esto es lo que está pasando hoy en recepción.',
  ODONTOLOGO: 'Estos son tus pacientes y pendientes de hoy.',
}

const ACCION_PRINCIPAL: Record<RolGestion, { texto: string; ruta: string }> = {
  ADMIN: { texto: 'Gestionar usuarios', ruta: '/gestion/usuarios' },
  RECEPCIONISTA: { texto: 'Abrir la agenda', ruta: '/gestion/agenda' },
  ODONTOLOGO: { texto: 'Ir a la ficha clínica', ruta: '/gestion/ficha-clinica' },
}

function Inicio() {
  const navigate = useNavigate()
  const rol = getRol()
  const rolGestion: RolGestion = rol && rol !== 'PACIENTE' ? rol : 'RECEPCIONISTA'
  const tema = temaDeRol(rolGestion)
  const usuario = getUsuarioSesion()

  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [ahora, setAhora] = useState(() => Date.now())

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      setResumen(await apiGet<Resumen>('/api/dashboard/resumen'))
      setAhora(Date.now())
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

  // Actualiza los textos "En X min" cada minuto
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), 60000)
    return () => window.clearInterval(id)
  }, [])

  const citas = useMemo(() => resumen?.citasDelDia ?? [], [resumen])
  const primeraCarga = cargando && !resumen

  const fechaHoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

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
          sx={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', right: -90, top: -150, background: tema.gradiente, opacity: 0.32, filter: 'blur(34px)' }}
        />
        <Box
          aria-hidden
          sx={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', left: '38%', bottom: -170, background: tema.gradiente, opacity: 0.18, filter: 'blur(40px)' }}
        />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ position: 'relative', justifyContent: 'space-between', alignItems: { md: 'center' } }}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap', rowGap: 1 }}>
              <Chip size="small" label={tema.espacio} sx={{ color: '#fff', fontWeight: 700, background: tema.gradiente }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.65)', textTransform: 'capitalize' }}>
                {fechaHoy}
              </Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontSize: { xs: '1.6rem', sm: '2.1rem' } }}>
              {saludo()}, {usuario.nombres || usuario.username || 'equipo'}
            </Typography>
            <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.72)', maxWidth: 560 }}>
              {MENSAJE[rolGestion]}
            </Typography>
          </Box>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.25 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => void cargar()}
              disabled={cargando}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,.35)',
                '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,.08)' },
                '&.Mui-disabled': { color: 'rgba(255,255,255,.45)', borderColor: 'rgba(255,255,255,.2)' },
              }}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(ACCION_PRINCIPAL[rolGestion].ruta)}
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{ background: tema.gradiente, whiteSpace: 'nowrap' }}
            >
              {ACCION_PRINCIPAL[rolGestion].texto}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => void cargar()}>Reintentar</Button>}>
          {error}
        </Alert>
      )}

      {/* ===== Indicadores (cada tarjeta lleva a su módulo) ===== */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {TARJETAS_POR_ROL[rolGestion].map((clave, i) => {
          const tarjeta = TARJETAS[clave]
          return (
            <Grid key={clave} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card
                component="button"
                type="button"
                onClick={() => navigate(tarjeta.ruta)}
                sx={{
                  all: 'unset',
                  boxSizing: 'border-box',
                  display: 'block',
                  width: '100%',
                  p: 2.5,
                  height: '100%',
                  cursor: 'pointer',
                  bgcolor: '#fff',
                  border: `1px solid ${C.line}`,
                  borderRadius: '18px',
                  animation: `md-aparecer .45s ${i * 70}ms cubic-bezier(.2,.8,.2,1) both`,
                  transition: 'transform .2s ease, box-shadow .25s ease, border-color .25s ease',
                  '&:hover, &:focus-visible': { transform: 'translateY(-3px)', boxShadow: '0 14px 30px -18px var(--rol-sombra)', borderColor: 'primary.light' },
                }}
              >
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{tarjeta.titulo}</Typography>
                    {primeraCarga ? (
                      <Skeleton width={60} height={52} />
                    ) : (
                      <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.3 }}>
                        {resumen ? (resumen[clave] ?? 0) : '—'}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">{tarjeta.detalle}</Typography>
                  </Box>
                  <Box sx={{ width: 46, height: 46, borderRadius: 3, display: 'grid', placeItems: 'center', color: 'var(--rol-main)', backgroundColor: 'var(--rol-tint)', flexShrink: 0 }}>
                    {tarjeta.icono}
                  </Box>
                </Stack>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* ===== Panel propio del rol ===== */}
      {rolGestion === 'ODONTOLOGO' && <PanelOdontologo citas={citas} cargando={primeraCarga} ahora={ahora} />}
      {rolGestion === 'RECEPCIONISTA' && <PanelRecepcion resumen={resumen} citas={citas} cargando={primeraCarga} />}
      {rolGestion === 'ADMIN' && <PanelAdmin citas={citas} cargando={primeraCarga} />}
    </Box>
  )
}

export default Inicio
