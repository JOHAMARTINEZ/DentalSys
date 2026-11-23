import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import TodayRoundedIcon from '@mui/icons-material/TodayRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'

import { apiGet, apiPost, apiPut, getRol, mensajeError } from '../services/api'
import { alCerrar } from '../services/dialogos'
import EncabezadoPagina from '../components/ui/EncabezadoPagina'
import Indicador from '../components/ui/Indicador'

/* =========================================================
   AGENDA
   - Vista por día o por semana, con filtros.
   - Recepción / administración: crear, confirmar, cancelar y
     reprogramar citas.
   - Odontólogo: ve solo su agenda y marca asistencia
     (confirmada, completada, no asistió).
   - Las horas que se ofrecen salen de GET /api/citas/disponibilidad
     (horario del odontólogo, bloqueos y citas ya tomadas).
========================================================= */

// Degradado del color del rol (ver components/layout/temaRol.ts)
const GRADIENT = 'var(--rol-gradiente)'

type Estado = 'RESERVADA' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO'

interface Cita {
  idCita: number
  fechaHora: string
  fechaHoraFin: string
  estado: Estado
  comentario: string | null
  idMotivo: number | null
  tipoAtencion: string | null
  idPaciente: number
  pacienteNombre: string
  pacienteRut: string
  pacienteTelefono: string | null
  pacienteCorreo: string | null
  idOdontologo: number
  odontologoNombre: string
  especialidad: string
  idSucursal: number
  sucursalNombre: string
  sucursalDireccion: string
  fechaCreacion: string | null
  creadaPor: string | null
  idAtencion: number | null
  estadoAtencion: 'BORRADOR' | 'CERRADA' | null
}

interface Historial {
  idHistorial: number
  estadoAnterior: string | null
  estadoNuevo: string
  fechaCambio: string
  usuario: string | null
  observacion: string | null
}

interface Odontologo {
  idUsuario: number
  nombres: string
  apellidos: string
  especialidad: string
  sucursales: number[]
}

interface Sucursal {
  idSucursal: number
  nombre: string
}

interface Motivo {
  idMotivo: number
  nombre: string
  duracionMinutos: number
}

interface PacienteOpcion {
  idPaciente: number
  rut: string
  nombres: string
  apellidos: string
  activo: boolean
}

interface Disponibilidad {
  horarioConfigurado: boolean
  duracionMinutos: number
  bloques: { hora: string; disponible: boolean }[]
}

const ESTADOS: Record<Estado, { label: string; color: string; fondo: string }> = {
  RESERVADA: { label: 'Reservada', color: '#b45309', fondo: '#fef3c7' },
  CONFIRMADA: { label: 'Confirmada', color: '#1d4ed8', fondo: '#dbeafe' },
  COMPLETADA: { label: 'Completada', color: '#047857', fondo: '#d1fae5' },
  CANCELADA: { label: 'Cancelada', color: '#64748b', fondo: '#f1f5f9' },
  NO_ASISTIO: { label: 'No asistió', color: '#b91c1c', fondo: '#fee2e2' },
}

/* ---------- Fechas (siempre en hora local) ---------- */

function aISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

function desdeISO(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

function sumarDias(iso: string, dias: number): string {
  const f = desdeISO(iso)
  f.setDate(f.getDate() + dias)
  return aISO(f)
}

function lunesDe(iso: string): string {
  const f = desdeISO(iso)
  const dia = f.getDay() === 0 ? 7 : f.getDay()
  return sumarDias(iso, 1 - dia)
}

function hora(fecha: string): string {
  return new Date(fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}

function fechaTitulo(iso: string, opciones: Intl.DateTimeFormatOptions): string {
  return desdeISO(iso).toLocaleDateString('es-CL', opciones)
}

function fechaHoraLarga(fecha: string): string {
  return new Date(fecha).toLocaleString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
}

/* =========================================================
   SELECTOR DE HORA (usa la disponibilidad real)
========================================================= */

interface SelectorHoraProps {
  idOdontologo: number | ''
  idSucursal: number | ''
  fecha: string
  idMotivo: number | ''
  valor: string
  onChange: (hora: string) => void
}

function SelectorHora({ idOdontologo, idSucursal, fecha, idMotivo, valor, onChange }: SelectorHoraProps) {
  const [datos, setDatos] = useState<Disponibilidad | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!idOdontologo || !idSucursal || !fecha) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDatos(null)
      return
    }

    let activo = true
    setCargando(true)
    setError('')
    const motivo = idMotivo ? `&idMotivo=${idMotivo}` : ''

    apiGet<Disponibilidad>(`/api/citas/disponibilidad?idOdontologo=${idOdontologo}&idSucursal=${idSucursal}&fecha=${fecha}${motivo}`)
      .then((r) => { if (activo) setDatos(r) })
      .catch((err) => { if (activo) setError(mensajeError(err)) })
      .finally(() => { if (activo) setCargando(false) })

    return () => { activo = false }
  }, [idOdontologo, idSucursal, fecha, idMotivo])

  if (!idOdontologo || !idSucursal || !fecha) {
    return <Typography variant="body2" color="text.secondary">Elige sucursal, odontólogo y fecha para ver las horas.</Typography>
  }

  if (cargando) return <Skeleton variant="rounded" height={72} />
  if (error) return <Alert severity="error">{error}</Alert>
  if (!datos) return null

  if (!datos.horarioConfigurado) {
    return <Alert severity="info">El odontólogo no atiende ese día en esta sucursal. Prueba otra fecha.</Alert>
  }

  const libres = datos.bloques.filter((b) => b.disponible)

  if (libres.length === 0) {
    return <Alert severity="warning">No quedan horas disponibles ese día.</Alert>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {datos.bloques.map((b) => (
          <Chip
            key={b.hora}
            label={b.hora}
            clickable={b.disponible}
            disabled={!b.disponible}
            onClick={() => b.disponible && onChange(b.hora)}
            color={valor === b.hora ? 'primary' : 'default'}
            variant={valor === b.hora ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700, minWidth: 68, textDecoration: b.disponible ? 'none' : 'line-through' }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {libres.length} horas libres · duración {datos.duracionMinutos} min
      </Typography>
    </Box>
  )
}

/* =========================================================
   TARJETA DE CITA
========================================================= */

function TarjetaCita({ cita, compacta, mostrarOdontologo, onClick }: {
  cita: Cita
  compacta?: boolean
  mostrarOdontologo: boolean
  onClick: () => void
}) {
  const estado = ESTADOS[cita.estado]
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: 'unset',
        boxSizing: 'border-box',
        width: '100%',
        cursor: 'pointer',
        display: 'flex',
        gap: compacta ? 1 : 2,
        alignItems: compacta ? 'flex-start' : 'center',
        flexDirection: compacta ? 'column' : 'row',
        p: compacta ? 1 : 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${estado.color}`,
        backgroundColor: cita.estado === 'CANCELADA' ? '#fafafa' : '#fff',
        opacity: cita.estado === 'CANCELADA' ? 0.65 : 1,
        transition: 'all .15s',
        '&:hover, &:focus-visible': {
          borderColor: 'primary.light',
          borderLeftColor: estado.color,
          boxShadow: '0 8px 20px -14px var(--rol-sombra)',
          transform: compacta ? 'none' : 'translateX(2px)',
        },
      }}
    >
      <Box sx={{ minWidth: compacta ? 0 : 74 }}>
        <Typography sx={{ fontWeight: 800, fontSize: compacta ? '0.8rem' : '1rem', color: '#0b1220' }}>
          {hora(cita.fechaHora)}
        </Typography>
        {!compacta && <Typography variant="caption" color="text.secondary">a {hora(cita.fechaHoraFin)}</Typography>}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
        <Typography sx={{ fontWeight: 700, fontSize: compacta ? '0.8rem' : '0.95rem', textDecoration: cita.estado === 'CANCELADA' ? 'line-through' : 'none' }} noWrap>
          {cita.pacienteNombre}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
          {cita.tipoAtencion || 'Atención dental'}
          {!compacta && mostrarOdontologo && ` · ${cita.odontologoNombre}`}
          {!compacta && ` · ${cita.sucursalNombre}`}
        </Typography>
      </Box>
      {!compacta && (
        <Chip size="small" label={estado.label} sx={{ bgcolor: estado.fondo, color: estado.color }} />
      )}
    </Box>
  )
}

/* =========================================================
   PÁGINA
========================================================= */

function Agenda() {
  const rol = getRol()
  const esOdontologo = rol === 'ODONTOLOGO'
  const gestiona = rol === 'ADMIN' || rol === 'RECEPCIONISTA'
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [vista, setVista] = useState<'dia' | 'semana'>('dia')
  const [fecha, setFecha] = useState(aISO(new Date()))
  const [filtroOdontologo, setFiltroOdontologo] = useState<number | ''>('')
  const [filtroSucursal, setFiltroSucursal] = useState<number | ''>('')
  const [filtroEstado, setFiltroEstado] = useState<Estado | ''>('')
  const [ocultarCanceladas, setOcultarCanceladas] = useState(true)

  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [odontologos, setOdontologos] = useState<Odontologo[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [motivos, setMotivos] = useState<Motivo[]>([])

  // Detalle
  const [detalle, setDetalle] = useState<Cita | null>(null)
  const [historial, setHistorial] = useState<Historial[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  // Cambio de estado
  const [cambio, setCambio] = useState<{ cita: Cita; estado: Estado } | null>(null)
  const [observacion, setObservacion] = useState('')

  // Nueva cita / reprogramar
  const [dialogoNueva, setDialogoNueva] = useState(false)
  const [reprogramando, setReprogramando] = useState<Cita | null>(null)
  const [pacientes, setPacientes] = useState<PacienteOpcion[]>([])
  const [paciente, setPaciente] = useState<PacienteOpcion | null>(null)
  const [nSucursal, setNSucursal] = useState<number | ''>('')
  const [nOdontologo, setNOdontologo] = useState<number | ''>('')
  const [nMotivo, setNMotivo] = useState<number | ''>('')
  const [nFecha, setNFecha] = useState(aISO(new Date()))
  const [nHora, setNHora] = useState('')
  const [nComentario, setNComentario] = useState('')

  const [errorAccion, setErrorAccion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  const desde = vista === 'dia' ? fecha : lunesDe(fecha)
  const hasta = vista === 'dia' ? fecha : sumarDias(lunesDe(fecha), 6)

  /* ---------- Carga ---------- */

  const cargarCitas = useCallback(async () => {
    setCargando(true)
    setError('')
    const params = new URLSearchParams({ desde, hasta })
    if (filtroOdontologo) params.set('idOdontologo', String(filtroOdontologo))
    if (filtroSucursal) params.set('idSucursal', String(filtroSucursal))
    if (filtroEstado) params.set('estado', filtroEstado)
    try {
      setCitas(await apiGet<Cita[]>(`/api/citas?${params.toString()}`))
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar la agenda.'))
    } finally {
      setCargando(false)
    }
  }, [desde, hasta, filtroOdontologo, filtroSucursal, filtroEstado])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargarCitas()
  }, [cargarCitas])

  useEffect(() => {
    Promise.all([
      apiGet<Odontologo[]>('/api/odontologos'),
      apiGet<Sucursal[]>('/api/sucursales'),
      apiGet<Motivo[]>('/api/motivos-cita'),
    ])
      .then(([o, s, m]) => {
        setOdontologos(o)
        setSucursales(s)
        setMotivos(m)
      })
      .catch(() => {
        // Las listas son de apoyo: si fallan, la agenda igual se muestra
      })
  }, [])

  /* ---------- Nueva cita (también desde Pacientes: ?nuevaCita=id) ---------- */

  const abrirNueva = useCallback(async (idPaciente?: number) => {
    setReprogramando(null)
    setPaciente(null)
    setNSucursal(sucursales.length === 1 ? sucursales[0].idSucursal : '')
    setNOdontologo('')
    setNMotivo('')
    setNFecha(fecha < aISO(new Date()) ? aISO(new Date()) : fecha)
    setNHora('')
    setNComentario('')
    setErrorAccion('')
    setDialogoNueva(true)
    try {
      const lista = await apiGet<PacienteOpcion[]>('/api/pacientes?estado=ACTIVOS')
      setPacientes(lista)
      if (idPaciente) {
        setPaciente(lista.find((p) => p.idPaciente === idPaciente) ?? null)
      }
    } catch (err) {
      setErrorAccion(mensajeError(err, 'No fue posible cargar los pacientes.'))
    }
  }, [sucursales, fecha])

  useEffect(() => {
    const id = Number(searchParams.get('nuevaCita'))
    if (id && gestiona) {
      setSearchParams({}, { replace: true })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void abrirNueva(id)
    }
  }, [searchParams, setSearchParams, gestiona, abrirNueva])

  const abrirReprogramar = (cita: Cita) => {
    setReprogramando(cita)
    setNSucursal(cita.idSucursal)
    setNOdontologo(cita.idOdontologo)
    setNMotivo(cita.idMotivo ?? '')
    setNFecha(aISO(new Date(cita.fechaHora)) < aISO(new Date()) ? aISO(new Date()) : aISO(new Date(cita.fechaHora)))
    setNHora('')
    setNComentario('')
    setErrorAccion('')
    setDialogoNueva(true)
  }

  const odontologosDeSucursal = useMemo(
    () => odontologos.filter((o) => !nSucursal || o.sucursales.includes(nSucursal)),
    [odontologos, nSucursal],
  )

  const guardarCita = async () => {
    if (!reprogramando && !paciente) { setErrorAccion('Selecciona el paciente.'); return }
    if (!nSucursal || !nOdontologo) { setErrorAccion('Selecciona sucursal y odontólogo.'); return }
    if (!nHora) { setErrorAccion('Selecciona una hora disponible.'); return }

    setGuardando(true)
    setErrorAccion('')
    const fechaHora = `${nFecha}T${nHora}:00`
    try {
      if (reprogramando) {
        await apiPut<Cita>(`/api/citas/${reprogramando.idCita}/reprogramar`, {
          fechaHora,
          idOdontologo: nOdontologo,
          idSucursal: nSucursal,
          observacion: nComentario.trim() || null,
        })
        setAviso('Cita reprogramada.')
      } else if (paciente) {
        await apiPost<Cita>('/api/citas', {
          idPaciente: paciente.idPaciente,
          idOdontologo: nOdontologo,
          idSucursal: nSucursal,
          idMotivo: nMotivo || null,
          fechaHora,
          comentario: nComentario.trim() || null,
        })
        setAviso('Cita agendada.')
      }
      setDialogoNueva(false)
      setDetalle(null)
      setFecha(nFecha)
      await cargarCitas()
    } catch (err) {
      setErrorAccion(mensajeError(err, 'No fue posible guardar la cita.'))
    } finally {
      setGuardando(false)
    }
  }

  /* ---------- Detalle y estados ---------- */

  const abrirDetalle = async (cita: Cita) => {
    setDetalle(cita)
    setHistorial([])
    setErrorAccion('')
    setCargandoHistorial(true)
    try {
      setHistorial(await apiGet<Historial[]>(`/api/citas/${cita.idCita}/historial`))
    } catch {
      setHistorial([])
    } finally {
      setCargandoHistorial(false)
    }
  }

  const confirmarCambio = async () => {
    if (!cambio) return
    setGuardando(true)
    setErrorAccion('')
    try {
      const actualizada = await apiPut<Cita>(`/api/citas/${cambio.cita.idCita}/estado`, {
        estado: cambio.estado,
        observacion: observacion.trim() || null,
      })
      setAviso(`Cita marcada como ${ESTADOS[cambio.estado].label.toLowerCase()}.`)
      setCambio(null)
      setObservacion('')
      await cargarCitas()
      if (detalle) await abrirDetalle(actualizada)
    } catch (err) {
      setErrorAccion(mensajeError(err, 'No fue posible cambiar el estado.'))
    } finally {
      setGuardando(false)
    }
  }

  /* ---------- Datos para mostrar ---------- */

  const visibles = useMemo(
    () => citas.filter((c) => !(ocultarCanceladas && c.estado === 'CANCELADA' && filtroEstado !== 'CANCELADA')),
    [citas, ocultarCanceladas, filtroEstado],
  )

  const resumen = useMemo(() => ({
    total: citas.filter((c) => c.estado !== 'CANCELADA').length,
    porConfirmar: citas.filter((c) => c.estado === 'RESERVADA').length,
    confirmadas: citas.filter((c) => c.estado === 'CONFIRMADA').length,
    completadas: citas.filter((c) => c.estado === 'COMPLETADA').length,
  }), [citas])

  const diasSemana = useMemo(() => {
    const lunes = lunesDe(fecha)
    return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i))
  }, [fecha])

  const mover = (paso: number) => setFecha(sumarDias(fecha, vista === 'dia' ? paso : paso * 7))
  const hoy = aISO(new Date())

  const tituloRango = vista === 'dia'
    ? fechaTitulo(fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : `${fechaTitulo(desde, { day: 'numeric', month: 'short' })} – ${fechaTitulo(hasta, { day: 'numeric', month: 'short', year: 'numeric' })}`

  const ahora = new Date()
  const yaComenzo = (c: Cita) => new Date(c.fechaHora) <= ahora
  const abierta = (c: Cita) => c.estado === 'RESERVADA' || c.estado === 'CONFIRMADA'

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Box>
      {/* Encabezado */}
      <EncabezadoPagina
        icono={<CalendarMonthOutlinedIcon />}
        titulo={<Box component="span" sx={{ textTransform: 'capitalize' }}>{tituloRango}</Box>}
        descripcion={esOdontologo
          ? 'Tu agenda de atención. Abre una cita para registrar la atención clínica.'
          : 'Agenda de la clínica: agenda, confirma, reprograma y registra asistencia.'}
        acciones={(
        <>
          <ToggleButtonGroup size="small" exclusive value={vista} onChange={(_, v) => v && setVista(v)}>
            <ToggleButton value="dia" sx={{ px: 2 }}>Día</ToggleButton>
            <ToggleButton value="semana" sx={{ px: 2 }}>Semana</ToggleButton>
          </ToggleButtonGroup>
          <IconButton onClick={() => mover(-1)} aria-label="Anterior"><ChevronLeftRoundedIcon /></IconButton>
          <Button size="small" variant={fecha === hoy ? 'contained' : 'outlined'} startIcon={<TodayRoundedIcon />} onClick={() => setFecha(hoy)}>Hoy</Button>
          <IconButton onClick={() => mover(1)} aria-label="Siguiente"><ChevronRightRoundedIcon /></IconButton>
          <TextField type="date" value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} sx={{ width: 160 }} />
          {gestiona && (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => void abrirNueva()} sx={{ background: GRADIENT }}>
              Nueva cita
            </Button>
          )}
        </>
        )}
      />

      {/* Resumen */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {[
          { titulo: vista === 'dia' ? 'Citas del día' : 'Citas de la semana', valor: resumen.total, icono: <CalendarMonthOutlinedIcon /> },
          { titulo: 'Por confirmar', valor: resumen.porConfirmar, icono: <PendingActionsOutlinedIcon />, destacado: resumen.porConfirmar > 0 },
          { titulo: 'Confirmadas', valor: resumen.confirmadas, icono: <EventAvailableOutlinedIcon /> },
          { titulo: 'Completadas', valor: resumen.completadas, icono: <TaskAltRoundedIcon /> },
        ].map((item, i) => (
          <Grid key={item.titulo} size={{ xs: 6, md: 3 }}>
            <Indicador titulo={item.titulo} valor={item.valor} icono={item.icono} destacado={item.destacado} cargando={cargando} indice={i} />
          </Grid>
        ))}
      </Grid>

      {/* Filtros */}
      <Card sx={{ p: 2, mb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
          {!esOdontologo && (
            <TextField select label="Odontólogo" value={filtroOdontologo} onChange={(e) => setFiltroOdontologo(e.target.value === '' ? '' : Number(e.target.value))}>
              <MenuItem value="">Todos</MenuItem>
              {odontologos.map((o) => <MenuItem key={o.idUsuario} value={o.idUsuario}>{o.nombres} {o.apellidos}</MenuItem>)}
            </TextField>
          )}
          <TextField select label="Sucursal" value={filtroSucursal} onChange={(e) => setFiltroSucursal(e.target.value === '' ? '' : Number(e.target.value))}>
            <MenuItem value="">Todas</MenuItem>
            {sucursales.map((s) => <MenuItem key={s.idSucursal} value={s.idSucursal}>{s.nombre}</MenuItem>)}
          </TextField>
          <TextField select label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as Estado | '')}>
            <MenuItem value="">Todos</MenuItem>
            {(Object.keys(ESTADOS) as Estado[]).map((e) => <MenuItem key={e} value={e}>{ESTADOS[e].label}</MenuItem>)}
          </TextField>
          <Chip
            label={ocultarCanceladas ? 'Canceladas ocultas' : 'Mostrando canceladas'}
            onClick={() => setOcultarCanceladas((v) => !v)}
            variant={ocultarCanceladas ? 'outlined' : 'filled'}
            sx={{ flexShrink: 0 }}
          />
          <Tooltip title="Actualizar">
            <IconButton onClick={() => void cargarCitas()} aria-label="Actualizar"><RefreshRoundedIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ===== Vista día ===== */}
      {vista === 'dia' && (
        <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
          {cargando && <Stack spacing={1.25}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={68} />)}</Stack>}
          {!cargando && visibles.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <EventBusyOutlinedIcon sx={{ fontSize: 46, color: '#c3cbe0' }} />
              <Typography sx={{ mt: 1, fontWeight: 600 }}>No hay citas este día</Typography>
              {gestiona && <Button sx={{ mt: 1.5 }} startIcon={<AddRoundedIcon />} onClick={() => void abrirNueva()}>Agendar una cita</Button>}
            </Box>
          )}
          {!cargando && visibles.length > 0 && (
            <Stack spacing={1.25}>
              {visibles.map((c) => (
                <TarjetaCita key={c.idCita} cita={c} mostrarOdontologo={!esOdontologo} onClick={() => void abrirDetalle(c)} />
              ))}
            </Stack>
          )}
        </Card>
      )}

      {/* ===== Vista semana ===== */}
      {vista === 'semana' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(7, minmax(0, 1fr))' }, gap: 1.5 }}>
          {diasSemana.map((dia) => {
            const delDia = visibles.filter((c) => aISO(new Date(c.fechaHora)) === dia)
            const esHoy = dia === hoy
            return (
              <Card key={dia} sx={{ p: 1.25, minHeight: { md: 280 }, borderColor: esHoy ? 'primary.main' : 'divider' }}>
                <Box
                  onClick={() => { setFecha(dia); setVista('dia') }}
                  sx={{ cursor: 'pointer', textAlign: 'center', pb: 1, mb: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    {fechaTitulo(dia, { weekday: 'short' })}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: esHoy ? 'primary.main' : 'text.primary' }}>
                    {desdeISO(dia).getDate()}
                  </Typography>
                </Box>
                {cargando ? <Skeleton variant="rounded" height={40} /> : (
                  <Stack spacing={0.75}>
                    {delDia.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>Sin citas</Typography>}
                    {delDia.map((c) => (
                      <TarjetaCita key={c.idCita} cita={c} compacta mostrarOdontologo={!esOdontologo} onClick={() => void abrirDetalle(c)} />
                    ))}
                  </Stack>
                )}
              </Card>
            )
          })}
        </Box>
      )}

      {/* ===== Detalle de la cita ===== */}
      <Dialog open={detalle !== null && !dialogoNueva && cambio === null} onClose={alCerrar(() => setDetalle(null), { escape: true })} fullWidth maxWidth="sm">
        {detalle && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              <Typography variant="h6" component="span">{detalle.pacienteNombre}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {fechaHoraLarga(detalle.fechaHora)} – {hora(detalle.fechaHoraFin)}
              </Typography>
              <IconButton onClick={() => setDetalle(null)} sx={{ position: 'absolute', right: 12, top: 12 }} aria-label="Cerrar"><CloseRoundedIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {errorAccion && <Alert severity="error" sx={{ mb: 2 }}>{errorAccion}</Alert>}
              <Chip label={ESTADOS[detalle.estado].label} sx={{ bgcolor: ESTADOS[detalle.estado].fondo, color: ESTADOS[detalle.estado].color, mb: 2 }} />

              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1.5}><PersonOutlineRoundedIcon fontSize="small" color="action" /><Typography variant="body2">{detalle.pacienteNombre} · {detalle.pacienteRut}</Typography></Stack>
                <Stack direction="row" spacing={1.5}><PhoneOutlinedIcon fontSize="small" color="action" /><Typography variant="body2">{detalle.pacienteTelefono || 'Sin teléfono'}{detalle.pacienteCorreo ? ` · ${detalle.pacienteCorreo}` : ''}</Typography></Stack>
                <Stack direction="row" spacing={1.5}><MedicalServicesOutlinedIcon fontSize="small" color="action" /><Typography variant="body2">{detalle.tipoAtencion || 'Atención dental'} con {detalle.odontologoNombre} ({detalle.especialidad})</Typography></Stack>
                <Stack direction="row" spacing={1.5}><PlaceOutlinedIcon fontSize="small" color="action" /><Typography variant="body2">{detalle.sucursalNombre} · {detalle.sucursalDireccion}</Typography></Stack>
                {detalle.comentario && (
                  <Stack direction="row" spacing={1.5}><NotesOutlinedIcon fontSize="small" color="action" /><Typography variant="body2">{detalle.comentario}</Typography></Stack>
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <HistoryRoundedIcon fontSize="small" color="action" />
                <Typography variant="subtitle2">Historial</Typography>
              </Stack>
              {cargandoHistorial ? <Skeleton variant="rounded" height={48} /> : (
                <Stack spacing={1}>
                  {historial.map((h) => (
                    <Box key={h.idHistorial} sx={{ pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {h.estadoAnterior ? `${ESTADOS[h.estadoAnterior as Estado]?.label ?? h.estadoAnterior} → ` : ''}
                        {ESTADOS[h.estadoNuevo as Estado]?.label ?? h.estadoNuevo}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(h.fechaCambio).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23' })} · {h.usuario ?? 'Reserva online'}
                      </Typography>
                      {h.observacion && <Typography variant="body2" color="text.secondary">{h.observacion}</Typography>}
                    </Box>
                  ))}
                  {historial.length === 0 && <Typography variant="body2" color="text.secondary">Sin registros.</Typography>}
                </Stack>
              )}
            </DialogContent>
            {esOdontologo && detalle.estado !== 'CANCELADA' && detalle.estado !== 'NO_ASISTIO' && (
              <Box sx={{ px: 3, pt: 2 }}>
                <Button
                  fullWidth
                  variant={detalle.idAtencion ? 'outlined' : 'contained'}
                  startIcon={<DescriptionOutlinedIcon />}
                  onClick={() => navigate(detalle.idAtencion
                    ? `/gestion/ficha-clinica?idPaciente=${detalle.idPaciente}`
                    : `/gestion/ficha-clinica?idPaciente=${detalle.idPaciente}&idCita=${detalle.idCita}`)}
                  sx={detalle.idAtencion ? undefined : { background: GRADIENT }}
                >
                  {detalle.idAtencion
                    ? `Ver ficha (atención ${detalle.estadoAtencion === 'CERRADA' ? 'cerrada' : 'en borrador'})`
                    : 'Registrar atención clínica'}
                </Button>
              </Box>
            )}
            {abierta(detalle) && (
              <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
                {gestiona && (
                  <Button color="error" onClick={() => { setCambio({ cita: detalle, estado: 'CANCELADA' }); setObservacion('') }}>Cancelar cita</Button>
                )}
                {gestiona && (
                  <Button startIcon={<EventRepeatOutlinedIcon />} onClick={() => abrirReprogramar(detalle)}>Reprogramar</Button>
                )}
                <Box sx={{ flexGrow: 1 }} />
                {!yaComenzo(detalle) && detalle.estado === 'RESERVADA' && (
                  <Button variant="contained" startIcon={<CheckRoundedIcon />} onClick={() => { setCambio({ cita: detalle, estado: 'CONFIRMADA' }); setObservacion('') }}>
                    Confirmar
                  </Button>
                )}
                {yaComenzo(detalle) && (
                  <>
                    <Button color="error" variant="outlined" startIcon={<PersonOffOutlinedIcon />} onClick={() => { setCambio({ cita: detalle, estado: 'NO_ASISTIO' }); setObservacion('') }}>
                      No asistió
                    </Button>
                    <Button variant="contained" color="success" startIcon={<DoneAllRoundedIcon />} onClick={() => { setCambio({ cita: detalle, estado: 'COMPLETADA' }); setObservacion('') }}>
                      Completada
                    </Button>
                  </>
                )}
              </DialogActions>
            )}
          </>
        )}
      </Dialog>

      {/* ===== Confirmar cambio de estado ===== */}
      <Dialog open={cambio !== null} onClose={alCerrar(() => setCambio(null), { bloqueado: guardando })} fullWidth maxWidth="xs">
        {cambio && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>
              {cambio.estado === 'CANCELADA' ? 'Cancelar cita' : `Marcar como ${ESTADOS[cambio.estado].label.toLowerCase()}`}
            </DialogTitle>
            <DialogContent>
              {errorAccion && <Alert severity="error" sx={{ mb: 2 }}>{errorAccion}</Alert>}
              <Typography sx={{ mb: 2 }}>
                {cambio.cita.pacienteNombre} · {fechaHoraLarga(cambio.cita.fechaHora)}
              </Typography>
              <TextField
                label={cambio.estado === 'CANCELADA' ? 'Motivo de la cancelación (opcional)' : 'Observación (opcional)'}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                multiline
                minRows={2}
                slotProps={{ htmlInput: { maxLength: 200 } }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button color="inherit" onClick={() => setCambio(null)} disabled={guardando}>Volver</Button>
              <Button
                variant="contained"
                color={cambio.estado === 'CANCELADA' || cambio.estado === 'NO_ASISTIO' ? 'error' : cambio.estado === 'COMPLETADA' ? 'success' : 'primary'}
                onClick={() => void confirmarCambio()}
                disabled={guardando}
              >
                {guardando ? <CircularProgress size={20} color="inherit" /> : 'Confirmar'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ===== Nueva cita / reprogramar ===== */}
      <Dialog open={dialogoNueva} onClose={alCerrar(() => setDialogoNueva(false), { bloqueado: guardando })} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {reprogramando ? `Reprogramar cita de ${reprogramando.pacienteNombre}` : 'Nueva cita'}
        </DialogTitle>
        <DialogContent dividers>
          {errorAccion && <Alert severity="error" sx={{ mb: 2 }}>{errorAccion}</Alert>}
          {reprogramando && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Hora actual: {fechaHoraLarga(reprogramando.fechaHora)}. La cita volverá a quedar como "Reservada".
            </Alert>
          )}

          <Grid container spacing={2}>
            {!reprogramando && (
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={pacientes}
                  value={paciente}
                  onChange={(_, valor) => setPaciente(valor)}
                  getOptionLabel={(p) => `${p.nombres} ${p.apellidos} · ${p.rut}`}
                  isOptionEqualToValue={(a, b) => a.idPaciente === b.idPaciente}
                  noOptionsText="Sin resultados. Regístralo primero en Pacientes."
                  renderInput={(params) => <TextField {...params} label="Paciente" placeholder="Busca por nombre o RUT" required />}
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Sucursal" required value={nSucursal} onChange={(e) => { setNSucursal(Number(e.target.value)); setNOdontologo(''); setNHora('') }}>
                {sucursales.map((s) => <MenuItem key={s.idSucursal} value={s.idSucursal}>{s.nombre}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Odontólogo" required value={nOdontologo} onChange={(e) => { setNOdontologo(Number(e.target.value)); setNHora('') }} disabled={!nSucursal}>
                {odontologosDeSucursal.map((o) => <MenuItem key={o.idUsuario} value={o.idUsuario}>{o.nombres} {o.apellidos}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField select label="Tipo de atención" value={nMotivo} onChange={(e) => { setNMotivo(e.target.value === '' ? '' : Number(e.target.value)); setNHora('') }} disabled={Boolean(reprogramando)}>
                <MenuItem value="">Sin especificar</MenuItem>
                {motivos.map((m) => <MenuItem key={m.idMotivo} value={m.idMotivo}>{m.nombre} ({m.duracionMinutos} min)</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                type="date" label="Fecha" required value={nFecha}
                onChange={(e) => { setNFecha(e.target.value); setNHora('') }}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: hoy } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Hora</Typography>
              <SelectorHora idOdontologo={nOdontologo} idSucursal={nSucursal} fecha={nFecha} idMotivo={nMotivo} valor={nHora} onChange={setNHora} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label={reprogramando ? 'Motivo del cambio (opcional)' : 'Comentario (opcional)'}
                value={nComentario}
                onChange={(e) => setNComentario(e.target.value)}
                multiline
                minRows={2}
                slotProps={{ htmlInput: { maxLength: reprogramando ? 150 : 255 } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setDialogoNueva(false)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={() => void guardarCita()} disabled={guardando} sx={{ background: GRADIENT }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : reprogramando ? 'Reprogramar' : 'Agendar cita'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={3500} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>{aviso}</Alert>
      </Snackbar>
    </Box>
  )
}

export default Agenda
