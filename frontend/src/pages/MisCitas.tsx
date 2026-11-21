import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
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
import { ThemeProvider, createTheme } from '@mui/material/styles'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'

import { apiGet, apiPut, mensajeError } from '../services/api'

/* =========================================================
   MIS CITAS (portal del paciente)
   - Próximas citas y su historial (GET /api/citas/mis-citas).
   - Puede cancelar una cita futura reservada o confirmada
     (PUT /api/citas/mis-citas/{id}/cancelar).
   Mismo diseño que la página pública y la reserva.
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

const theme = createTheme({
  palette: {
    primary: { main: C.blue, dark: C.blueDark, light: C.blueLight },
    secondary: { main: C.cyan },
    text: { primary: C.ink, secondary: C.muted },
    divider: C.line,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans Variable", system-ui, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05 },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    overline: { fontWeight: 700, letterSpacing: '0.16em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${C.line}`, borderRadius: 20 } },
    },
  },
})

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
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: C.surface, fontFamily: theme.typography.fontFamily }}>
        {/* Encabezado */}
        <Box sx={{ position: 'relative', overflow: 'hidden', color: '#fff', pt: 3, pb: { xs: 12, md: 14 }, background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navy2} 100%)` }}>
          <Box aria-hidden sx={{ position: 'absolute', top: -160, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,.5), transparent 65%)', filter: 'blur(20px)' }} />
          <Container maxWidth="md" sx={{ position: 'relative' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box onClick={() => navigate('/portal')} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 3, display: 'grid', placeItems: 'center', background: GRADIENT }}>
                  <MedicalServicesOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>Más Dent</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.6)' }}>Portal de pacientes · DentalSys</Typography>
                </Box>
              </Box>
              <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/portal')} sx={{ color: 'rgba(255,255,255,.8)' }}>
                Volver al portal
              </Button>
            </Stack>
            <Typography variant="overline" sx={{ display: 'block', mt: { xs: 5, md: 7 }, color: C.cyan }}>Mis horas</Typography>
            <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: '2.2rem', md: '3rem' } }}>Mis citas</Typography>
            <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,.72)', maxWidth: 560 }}>
              Revisa tus próximas horas y el historial de tus atenciones.
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="md" sx={{ position: 'relative', mt: { xs: -8, md: -9 }, pb: 10 }}>
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
        </Container>

        <Dialog open={cancelando !== null} onClose={() => !guardando && setCancelando(null)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 5 } } }}>
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
    </ThemeProvider>
  )
}

export default MisCitas
