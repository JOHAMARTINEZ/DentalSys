import { useCallback, useEffect, useMemo, useState } from 'react'

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
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'

import { apiDelete, apiGet, apiPost, apiPut, getRol, getUsuarioSesion, mensajeError } from '../services/api'
import { alCerrar } from '../services/dialogos'
import EncabezadoPagina from '../components/ui/EncabezadoPagina'

/* =========================================================
   HORARIOS DE ATENCIÓN Y BLOQUEOS
   - Horario semanal de cada odontólogo por sucursal
     (tabla horario_atencion). Define las horas que se pueden
     reservar en la agenda y en la reserva online.
   - Bloqueos: vacaciones, permisos, etc. (tabla bloqueo_agenda).
   Recepción y administración editan; el odontólogo ve los suyos.
========================================================= */

// Degradado del color del rol (ver components/layout/temaRol.ts)
const GRADIENT = 'var(--rol-gradiente)'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface Horario {
  idHorario: number
  idOdontologo: number
  odontologoNombre: string
  idSucursal: number
  sucursalNombre: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  activo: boolean
}

interface Bloqueo {
  idBloqueo: number
  idOdontologo: number
  odontologoNombre: string
  idSucursal: number
  sucursalNombre: string
  fechaHoraInicio: string
  fechaHoraFin: string
  motivo: string | null
  citasAfectadas: number
}

interface Odontologo {
  idUsuario: number
  nombres: string
  apellidos: string
  sucursales: number[]
}

interface Sucursal {
  idSucursal: number
  nombre: string
}

// Horas cada 30 minutos para los selectores (07:00 a 22:00)
const HORAS = Array.from({ length: 31 }, (_, i) => {
  const minutos = 7 * 60 + i * 30
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`
})

function corta(horaCompleta: string): string {
  return horaCompleta.slice(0, 5)
}

function fechaHora(valor: string): string {
  return new Date(valor).toLocaleString('es-CL', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
}

function Horarios() {
  const rol = getRol()
  const gestiona = rol === 'ADMIN' || rol === 'RECEPCIONISTA'
  const sesion = getUsuarioSesion()

  const [pestana, setPestana] = useState(0)
  const [odontologos, setOdontologos] = useState<Odontologo[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [idOdontologo, setIdOdontologo] = useState<number | ''>(rol === 'ODONTOLOGO' && sesion.idUsuario ? sesion.idUsuario : '')

  const [horarios, setHorarios] = useState<Horario[]>([])
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [listasCargadas, setListasCargadas] = useState(false)

  // Diálogo horario
  const [dlgHorario, setDlgHorario] = useState(false)
  const [editando, setEditando] = useState<Horario | null>(null)
  const [hSucursal, setHSucursal] = useState<number | ''>('')
  const [hDias, setHDias] = useState<number[]>([])
  const [hInicio, setHInicio] = useState('09:00')
  const [hFin, setHFin] = useState('13:00')

  // Diálogo bloqueo
  const [dlgBloqueo, setDlgBloqueo] = useState(false)
  const [bSucursal, setBSucursal] = useState<number | ''>('')
  const [bInicio, setBInicio] = useState('')
  const [bFin, setBFin] = useState('')
  const [bMotivo, setBMotivo] = useState('')

  // Eliminar
  const [eliminarHorario, setEliminarHorario] = useState<Horario | null>(null)
  const [anularBloqueo, setAnularBloqueo] = useState<Bloqueo | null>(null)

  const [errorDialogo, setErrorDialogo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    const filtro = idOdontologo ? `?idOdontologo=${idOdontologo}` : ''
    try {
      const [h, b] = await Promise.all([
        apiGet<Horario[]>(`/api/horarios${filtro}`),
        apiGet<Bloqueo[]>(`/api/horarios/bloqueos${filtro}`),
      ])
      setHorarios(h)
      setBloqueos(b)
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar los horarios.'))
    } finally {
      setCargando(false)
    }
  }, [idOdontologo])

  useEffect(() => {
    // Recepción y administración: se espera a tener el odontólogo elegido
    // (evita cargar y mostrar por un instante los horarios de todos)
    if (rol !== 'ODONTOLOGO' && idOdontologo === '') return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar, rol, idOdontologo])

  useEffect(() => {
    // Sin odontólogos registrados: no hay nada que cargar
    if (listasCargadas && rol !== 'ODONTOLOGO' && idOdontologo === '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCargando(false)
    }
  }, [listasCargadas, rol, idOdontologo])

  useEffect(() => {
    Promise.all([apiGet<Odontologo[]>('/api/odontologos'), apiGet<Sucursal[]>('/api/sucursales')])
      .then(([o, s]) => {
        setOdontologos(o)
        setSucursales(s)
        if (rol !== 'ODONTOLOGO' && o.length > 0) {
          setIdOdontologo((actual) => actual || o[0].idUsuario)
        }
      })
      .catch((err) => {
        setError(mensajeError(err, 'No fue posible cargar los odontólogos.'))
      })
      .finally(() => setListasCargadas(true))
  }, [rol])

  const odontologo = odontologos.find((o) => o.idUsuario === idOdontologo)
  const sucursalesOdontologo = useMemo(
    () => sucursales.filter((s) => !odontologo || odontologo.sucursales.includes(s.idSucursal)),
    [sucursales, odontologo],
  )

  const horasSemanales = useMemo(() => horarios.reduce((total, h) => {
    const [hi, mi] = h.horaInicio.split(':').map(Number)
    const [hf, mf] = h.horaFin.split(':').map(Number)
    return total + (hf * 60 + mf - hi * 60 - mi) / 60
  }, 0), [horarios])

  /* ---------- Horario ---------- */

  const abrirHorario = (h?: Horario) => {
    setEditando(h ?? null)
    setHSucursal(h ? h.idSucursal : sucursalesOdontologo.length === 1 ? sucursalesOdontologo[0].idSucursal : '')
    setHDias(h ? [h.diaSemana] : [])
    setHInicio(h ? corta(h.horaInicio) : '09:00')
    setHFin(h ? corta(h.horaFin) : '13:00')
    setErrorDialogo('')
    setDlgHorario(true)
  }

  const guardarHorario = async () => {
    if (!idOdontologo || !hSucursal || hDias.length === 0) {
      setErrorDialogo('Selecciona sucursal y al menos un día.')
      return
    }
    if (hInicio >= hFin) {
      setErrorDialogo('La hora de término debe ser posterior a la de inicio.')
      return
    }

    setGuardando(true)
    setErrorDialogo('')
    try {
      if (editando) {
        await apiPut(`/api/horarios/${editando.idHorario}`, {
          idOdontologo, idSucursal: hSucursal, diaSemana: hDias[0], horaInicio: hInicio, horaFin: hFin,
        })
      } else {
        // Un tramo por cada día seleccionado
        for (const dia of [...hDias].sort()) {
          await apiPost('/api/horarios', {
            idOdontologo, idSucursal: hSucursal, diaSemana: dia, horaInicio: hInicio, horaFin: hFin,
          })
        }
      }
      setAviso(editando ? 'Horario actualizado.' : 'Horario agregado.')
      setDlgHorario(false)
      await cargar()
    } catch (err) {
      setErrorDialogo(mensajeError(err, 'No fue posible guardar el horario.'))
      await cargar()
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminarHorario = async () => {
    if (!eliminarHorario) return
    setGuardando(true)
    try {
      await apiDelete(`/api/horarios/${eliminarHorario.idHorario}`)
      setAviso('Tramo eliminado.')
      setEliminarHorario(null)
      await cargar()
    } catch (err) {
      setError(mensajeError(err))
      setEliminarHorario(null)
    } finally {
      setGuardando(false)
    }
  }

  /* ---------- Bloqueo ---------- */

  const abrirBloqueo = () => {
    setBSucursal('')
    setBInicio('')
    setBFin('')
    setBMotivo('')
    setErrorDialogo('')
    setDlgBloqueo(true)
  }

  const guardarBloqueo = async () => {
    if (!idOdontologo || !bInicio || !bFin) {
      setErrorDialogo('Indica el inicio y el término del bloqueo.')
      return
    }
    if (bInicio >= bFin) {
      setErrorDialogo('El término debe ser posterior al inicio.')
      return
    }

    setGuardando(true)
    setErrorDialogo('')
    try {
      const creados = await apiPost<Bloqueo[]>('/api/horarios/bloqueos', {
        idOdontologo,
        idSucursal: bSucursal || null,
        fechaHoraInicio: `${bInicio}:00`,
        fechaHoraFin: `${bFin}:00`,
        motivo: bMotivo.trim() || null,
      })
      const afectadas = creados.reduce((t, b) => t + b.citasAfectadas, 0)
      setAviso(afectadas > 0
        ? `Bloqueo creado. Hay ${afectadas} cita(s) en ese periodo: reprográmalas desde la agenda.`
        : 'Bloqueo creado.')
      setDlgBloqueo(false)
      await cargar()
    } catch (err) {
      setErrorDialogo(mensajeError(err, 'No fue posible crear el bloqueo.'))
    } finally {
      setGuardando(false)
    }
  }

  const confirmarAnularBloqueo = async () => {
    if (!anularBloqueo) return
    setGuardando(true)
    try {
      await apiDelete(`/api/horarios/bloqueos/${anularBloqueo.idBloqueo}`)
      setAviso('Bloqueo anulado.')
      setAnularBloqueo(null)
      await cargar()
    } catch (err) {
      setError(mensajeError(err))
      setAnularBloqueo(null)
    } finally {
      setGuardando(false)
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Box>
      <EncabezadoPagina
        icono={<ScheduleOutlinedIcon />}
        titulo={rol === 'ODONTOLOGO' ? 'Mi horario de atención' : 'Horarios de atención'}
        descripcion={gestiona
          ? 'Define cuándo atiende cada odontólogo. Solo se podrán reservar horas dentro de estos tramos.'
          : 'Tu horario semanal y los periodos sin atención.'}
        acciones={rol !== 'ODONTOLOGO' && (
          <TextField select label="Odontólogo" value={idOdontologo} onChange={(e) => setIdOdontologo(Number(e.target.value))} sx={{ minWidth: 260 }} disabled={odontologos.length === 0}>
            {odontologos.map((o) => <MenuItem key={o.idUsuario} value={o.idUsuario}>{o.nombres} {o.apellidos}</MenuItem>)}
          </TextField>
        )}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {odontologos.length === 0 && listasCargadas && rol !== 'ODONTOLOGO' && (
        <Alert severity="info" sx={{ mb: 2 }}>No hay odontólogos activos. Créalos en la página Usuarios.</Alert>
      )}

      <Card>
        <Tabs value={pestana} onChange={(_, v) => setPestana(v)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab icon={<ScheduleOutlinedIcon />} iconPosition="start" label="Horario semanal" />
          <Tab icon={<EventBusyOutlinedIcon />} iconPosition="start" label={`Bloqueos (${bloqueos.length})`} />
        </Tabs>

        {/* ===== Horario semanal ===== */}
        {pestana === 0 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography color="text.secondary">
                {horarios.length === 0
                  ? 'Sin horario configurado'
                  : `${horasSemanales.toLocaleString('es-CL', { maximumFractionDigits: 1 })} horas semanales · ${horarios.length} ${horarios.length === 1 ? 'tramo' : 'tramos'}`}
              </Typography>
              {gestiona && idOdontologo !== '' && (
                <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => abrirHorario()} sx={{ background: GRADIENT }}>
                  Agregar tramo
                </Button>
              )}
            </Stack>

            {cargando ? <Skeleton variant="rounded" height={240} /> : (
              <Grid container spacing={1.5}>
                {DIAS.map((nombre, i) => {
                  const delDia = horarios.filter((h) => h.diaSemana === i + 1)
                  const esHoy = ((new Date().getDay() + 6) % 7) === i
                  return (
                    <Grid key={nombre} size={{ xs: 12, sm: 6, md: 'grow' }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: esHoy ? 'primary.main' : 'divider',
                          minHeight: 140,
                          height: '100%',
                          backgroundColor: delDia.length ? '#fff' : '#fafbfd',
                          animation: `md-aparecer .4s ${i * 40}ms cubic-bezier(.2,.8,.2,1) both`,
                        }}
                      >
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography sx={{ fontWeight: 800, color: esHoy ? 'primary.main' : 'text.primary' }}>{nombre}</Typography>
                          {esHoy && <Chip size="small" label="Hoy" color="primary" sx={{ height: 20, fontSize: '0.68rem' }} />}
                        </Stack>
                        {delDia.length === 0 && <Typography variant="caption" color="text.secondary">No atiende</Typography>}
                        <Stack spacing={0.75}>
                          {delDia.map((h) => (
                            <Box key={h.idHorario} sx={{ p: 1, borderRadius: 2, bgcolor: 'var(--rol-tint)', color: 'var(--rol-dark)' }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem' }}>{corta(h.horaInicio)} – {corta(h.horaFin)}</Typography>
                              <Typography variant="caption" sx={{ display: 'block', color: '#526077' }}>{h.sucursalNombre}</Typography>
                              {gestiona && (
                                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                                  <IconButton size="small" onClick={() => abrirHorario(h)} aria-label="Editar tramo"><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
                                  <IconButton size="small" color="error" onClick={() => setEliminarHorario(h)} aria-label="Eliminar tramo"><DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
                                </Stack>
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
            )}
          </Box>
        )}

        {/* ===== Bloqueos ===== */}
        {pestana === 1 && (
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography color="text.secondary">Periodos vigentes o futuros en que no se agendan horas.</Typography>
              {gestiona && idOdontologo !== '' && (
                <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={abrirBloqueo} sx={{ background: GRADIENT }}>
                  Bloquear agenda
                </Button>
              )}
            </Stack>

            {cargando ? <Skeleton variant="rounded" height={120} /> : bloqueos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <EventBusyOutlinedIcon sx={{ fontSize: 42, color: '#c3cbe0' }} />
                <Typography sx={{ mt: 1, fontWeight: 600 }}>Sin bloqueos programados</Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {bloqueos.map((b) => (
                  <Box key={b.idBloqueo} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ flexGrow: 1, minWidth: 220 }}>
                      <Typography sx={{ fontWeight: 700 }}>{fechaHora(b.fechaHoraInicio)} → {fechaHora(b.fechaHoraFin)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {b.sucursalNombre}{b.motivo ? ` · ${b.motivo}` : ''}
                      </Typography>
                    </Box>
                    {b.citasAfectadas > 0 && (
                      <Chip icon={<WarningAmberRoundedIcon />} color="warning" variant="outlined" label={`${b.citasAfectadas} cita(s) por reprogramar`} />
                    )}
                    {gestiona && (
                      <Tooltip title="Anular bloqueo">
                        <IconButton color="error" onClick={() => setAnularBloqueo(b)} aria-label="Anular bloqueo"><DeleteOutlineRoundedIcon /></IconButton>
                      </Tooltip>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Card>

      {/* ===== Diálogo tramo ===== */}
      <Dialog open={dlgHorario} onClose={alCerrar(() => setDlgHorario(false), { bloqueado: guardando })} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>{editando ? 'Editar tramo' : 'Agregar tramo de atención'}</DialogTitle>
        <DialogContent dividers>
          {errorDialogo && <Alert severity="error" sx={{ mb: 2 }}>{errorDialogo}</Alert>}
          <Stack spacing={2.5}>
            <TextField select label="Sucursal" required value={hSucursal} onChange={(e) => setHSucursal(Number(e.target.value))}>
              {sucursalesOdontologo.map((s) => <MenuItem key={s.idSucursal} value={s.idSucursal}>{s.nombre}</MenuItem>)}
            </TextField>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                {editando ? 'Día' : 'Días (puedes elegir varios)'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {DIAS.map((nombre, i) => {
                  const dia = i + 1
                  const elegido = hDias.includes(dia)
                  return (
                    <Chip
                      key={nombre}
                      label={nombre}
                      clickable
                      color={elegido ? 'primary' : 'default'}
                      variant={elegido ? 'filled' : 'outlined'}
                      onClick={() => setHDias((actual) => editando
                        ? [dia]
                        : actual.includes(dia) ? actual.filter((d) => d !== dia) : [...actual, dia])}
                    />
                  )
                })}
              </Box>
            </Box>
            <Stack direction="row" spacing={2}>
              <TextField select label="Desde" value={hInicio} onChange={(e) => setHInicio(e.target.value)}>
                {HORAS.slice(0, -1).map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </TextField>
              <TextField select label="Hasta" value={hFin} onChange={(e) => setHFin(e.target.value)}>
                {HORAS.slice(1).map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </TextField>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Tip: si atiende en la mañana y en la tarde con colación, agrega dos tramos (ej: 09:00–13:00 y 14:30–18:00).
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setDlgHorario(false)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={() => void guardarHorario()} disabled={guardando} sx={{ background: GRADIENT }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Diálogo bloqueo ===== */}
      <Dialog open={dlgBloqueo} onClose={alCerrar(() => setDlgBloqueo(false), { bloqueado: guardando })} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Bloquear agenda</DialogTitle>
        <DialogContent dividers>
          {errorDialogo && <Alert severity="error" sx={{ mb: 2 }}>{errorDialogo}</Alert>}
          <Stack spacing={2.5}>
            <TextField select label="Sucursal" value={bSucursal} onChange={(e) => setBSucursal(e.target.value === '' ? '' : Number(e.target.value))}>
              <MenuItem value="">Todas sus sucursales</MenuItem>
              {sucursalesOdontologo.map((s) => <MenuItem key={s.idSucursal} value={s.idSucursal}>{s.nombre}</MenuItem>)}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField type="datetime-local" label="Desde" required value={bInicio} onChange={(e) => setBInicio(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField type="datetime-local" label="Hasta" required value={bFin} onChange={(e) => setBFin(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <TextField label="Motivo (opcional)" value={bMotivo} onChange={(e) => setBMotivo(e.target.value)} placeholder="Ej: vacaciones, capacitación" slotProps={{ htmlInput: { maxLength: 200 } }} />
            <Alert severity="info">Las citas que ya existan en ese periodo no se cancelan solas: se te indicará cuántas hay para reprogramarlas.</Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setDlgBloqueo(false)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={() => void guardarBloqueo()} disabled={guardando} sx={{ background: GRADIENT }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Bloquear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Confirmaciones ===== */}
      <Dialog open={eliminarHorario !== null} onClose={alCerrar(() => setEliminarHorario(null), { bloqueado: guardando })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Eliminar tramo</DialogTitle>
        <DialogContent>
          <Typography>
            {eliminarHorario && `${DIAS[eliminarHorario.diaSemana - 1]} ${corta(eliminarHorario.horaInicio)}–${corta(eliminarHorario.horaFin)} en ${eliminarHorario.sucursalNombre}.`}
            {' '}Las citas ya agendadas se mantienen, pero no se podrán reservar nuevas horas en ese tramo.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setEliminarHorario(null)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={() => void confirmarEliminarHorario()} disabled={guardando}>{guardando ? <CircularProgress size={20} color="inherit" /> : 'Eliminar'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={anularBloqueo !== null} onClose={alCerrar(() => setAnularBloqueo(null), { bloqueado: guardando })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Anular bloqueo</DialogTitle>
        <DialogContent>
          <Typography>Las horas de ese periodo volverán a estar disponibles para reservar.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setAnularBloqueo(null)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={() => void confirmarAnularBloqueo()} disabled={guardando}>{guardando ? <CircularProgress size={20} color="inherit" /> : 'Anular'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={4500} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>{aviso}</Alert>
      </Snackbar>
    </Box>
  )
}

export default Horarios
