import { useCallback, useEffect, useMemo, useState } from 'react'
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
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'

import { apiGet, apiPut, mensajeError } from '../services/api'
import { alCerrar } from '../services/dialogos'

/* =========================================================
   MIS CITAS (portal del paciente)
   - Próximas citas y su historial (GET /api/citas/mis-citas).
   - Puede cancelar una cita futura reservada o confirmada
     (PUT /api/citas/mis-citas/{id}/cancelar).
   Se muestra dentro de PortalLayout (encabezado del portal).
========================================================= */

const C = {
  navy: '#0a1628',
  navy2: '#10264a',
  blue: '#2563eb',
  blueDark: '#1d4ed8',
  blueLight: '#60a5fa',
  cyan: '#22d3ee',
  ink: '#0b1220',
  muted: '#526077',
  line: '#e6eaf2',
  surface: '#f5f7fb',
  tint: '#eef4ff',
}

const GRADIENT = `linear-gradient(135deg, ${C.blue} 0%, ${C.cyan} 100%)`

type Estado = 'RESERVADA' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'NO_ASISTIO'

interface Cita {
  idCita: number
  fechaHora: string
  fechaHoraFin: string
  estado: Estado
  comentario: string | null
  tipoAtencion: string | null
  odontologoNombre: string
  especialidad: string
  sucursalNombre: string
  sucursalDireccion: string
}

const ESTADOS: Record<Estado, { label: string; color: string; fondo: string }> = {
  RESERVADA: { label: 'Reservada', color: '#b45309', fondo: '#fef3c7' },
  CONFIRMADA: { label: 'Confirmada', color: '#1d4ed8', fondo: '#dbeafe' },
  COMPLETADA: { label: 'Atendida', color: '#047857', fondo: '#d1fae5' },
  CANCELADA: { label: 'Cancelada', color: '#64748b', fondo: '#f1f5f9' },
  NO_ASISTIO: { label: 'No asististe', color: '#b91c1c', fondo: '#fee2e2' },
}

function MisCitas() {
  const navigate = useNavigate()

  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [pestana, setPestana] = useState(0)

  const [cancelando, setCancelando] = useState<Cita | null>(null)
  const [motivo, setMotivo] = useState('')
  const [errorCancelar, setErrorCancelar] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      setCitas(await apiGet<Cita[]>('/api/citas/mis-citas'))
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar tus citas.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  const proximas = useMemo(() => {
    const ahora = new Date()
    return citas
      .filter((c) => new Date(c.fechaHora) >= ahora && (c.estado === 'RESERVADA' || c.estado === 'CONFIRMADA'))
      .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
  }, [citas])

  const historial = useMemo(
    () => citas.filter((c) => !proximas.includes(c)),
    [citas, proximas],
  )

  const confirmarCancelacion = async () => {
    if (!cancelando) return
    setGuardando(true)
    setErrorCancelar('')
    try {
      await apiPut(`/api/citas/mis-citas/${cancelando.idCita}/cancelar`, { observacion: motivo.trim() || null })
      setAviso('Tu cita fue cancelada.')
      setCancelando(null)
      await cargar()
    } catch (err) {
      setErrorCancelar(mensajeError(err, 'No fue posible cancelar la cita.'))
    } finally {
      setGuardando(false)
    }
  }

  const lista = pestana === 0 ? proximas : historial

  return (
    <Box>
          <Card sx={{ boxShadow: '0 40px 80px -50px rgba(11,18,32,.45)' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, px: { xs: 2, sm: 3 }, pt: 1, borderBottom: `1px solid ${C.line}` }}>
              <Tabs value={pestana} onChange={(_, v) => setPestana(v)}>
                <Tab label={`Próximas (${proximas.length})`} />
                <Tab label={`Historial (${historial.length})`} />
              </Tabs>
              <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => navigate('/portal/reservar-cita')} sx={{ background: GRADIENT, my: 1, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                Reservar hora
              </Button>
            </Stack>

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

              {cargando && <Stack spacing={1.5}>{[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: 4 }} />)}</Stack>}

              {!cargando && lista.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <EventBusyOutlinedIcon sx={{ fontSize: 48, color: '#c3cbe0' }} />
                  <Typography sx={{ mt: 1, fontWeight: 700, color: 'text.primary' }}>
                    {pestana === 0 ? 'No tienes horas próximas' : 'Aún no tienes historial'}
                  </Typography>
                  {pestana === 0 && (
                    <Button sx={{ mt: 2 }} startIcon={<AddRoundedIcon />} onClick={() => navigate('/portal/reservar-cita')}>
                      Reservar una hora
                    </Button>
                  )}
                </Box>
              )}

              {!cargando && lista.length > 0 && (
                <Stack spacing={1.5}>
                  {lista.map((c) => {
                    const inicio = new Date(c.fechaHora)
                    const estado = ESTADOS[c.estado]
                    const cancelable = pestana === 0
                    return (
                      <Box key={c.idCita} sx={{ display: 'flex', gap: 2, p: 2, borderRadius: 4, border: `1px solid ${C.line}`, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Box sx={{ minWidth: 92, textAlign: 'center', py: 1.25, px: 1, borderRadius: 3, bgcolor: c.estado === 'CANCELADA' ? '#f1f5f9' : C.tint, color: c.estado === 'CANCELADA' ? C.muted : C.blue, alignSelf: { xs: 'flex-start', sm: 'stretch' } }}>
                          <Typography sx={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {inicio.toLocaleDateString('es-CL', { weekday: 'short' })}
                          </Typography>
                          <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.1 }}>{inicio.getDate()}</Typography>
                          <Typography sx={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            {inicio.toLocaleDateString('es-CL', { month: 'short' })}
                          </Typography>
                        </Box>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
                              {inicio.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })} · {c.tipoAtencion || 'Atención dental'}
                            </Typography>
                            <Chip size="small" label={estado.label} sx={{ bgcolor: estado.fondo, color: estado.color, fontWeight: 700 }} />
                          </Stack>
                          <Stack spacing={0.5} sx={{ mt: 1, color: 'text.secondary' }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <PersonOutlineRoundedIcon sx={{ fontSize: 18 }} />
                              <Typography variant="body2">{c.odontologoNombre} · {c.especialidad}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <PlaceOutlinedIcon sx={{ fontSize: 18 }} />
                              <Typography variant="body2">{c.sucursalNombre} · {c.sucursalDireccion}</Typography>
                            </Stack>
                            {c.comentario && (
                              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                                <NotesOutlinedIcon sx={{ fontSize: 18 }} />
                                <Typography variant="body2">{c.comentario}</Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>
                        {cancelable && (
                          <Box sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                            <Button color="error" variant="outlined" onClick={() => { setCancelando(c); setMotivo(''); setErrorCancelar('') }}>
                              Cancelar
                            </Button>
                          </Box>
                        )}
                      </Box>
                    )
                  })}
                </Stack>
              )}
            </Box>
          </Card>

        <Dialog open={cancelando !== null} onClose={alCerrar(() => setCancelando(null), { bloqueado: guardando })} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 5 } } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>¿Cancelar esta cita?</DialogTitle>
          <DialogContent>
            {errorCancelar && <Alert severity="error" sx={{ mb: 2 }}>{errorCancelar}</Alert>}
            {cancelando && (
              <Typography sx={{ mb: 2 }}>
                {new Date(cancelando.fechaHora).toLocaleString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}
                {' '}con {cancelando.odontologoNombre}.
              </Typography>
            )}
            <TextField fullWidth size="small" label="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 150 } }} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button color="inherit" onClick={() => setCancelando(null)} disabled={guardando}>Volver</Button>
            <Button variant="contained" color="error" onClick={() => void confirmarCancelacion()} disabled={guardando}>
              {guardando ? <CircularProgress size={20} color="inherit" /> : 'Cancelar cita'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={Boolean(aviso)} autoHideDuration={3500} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="success" variant="filled" onClose={() => setAviso('')}>{aviso}</Alert>
        </Snackbar>
    </Box>
  )
}

export default MisCitas
