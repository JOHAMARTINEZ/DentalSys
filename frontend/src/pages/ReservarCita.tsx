import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'

import {
  Alert, Box, Button, Card, Container, Grid, MenuItem, Stack, TextField, Typography,
} from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'

/* =========================================================
   COLORES Y TEMA (copiados de Home.tsx para mantener el mismo diseño)
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
  tintStrong: '#dbe7ff',
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
    h2: { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15 },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    overline: { fontWeight: 700, letterSpacing: '0.16em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999 }, sizeLarge: { padding: '13px 28px', fontSize: '1rem' } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${C.line}`, borderRadius: 20 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 12, backgroundColor: '#fff' } },
    },
  },
})

/* =========================================================
   TIPOS Y CONSTANTES
========================================================= */

const API_URL = 'http://localhost:8080'

type Odontologo = {
  idUsuario: number
  nombres: string
  apellidos: string
  especialidad?: string
}

type Sucursal = {
  idSucursal: number
  nombre: string
  direccion: string
}

type MotivoCita = {
  idMotivo: number
  nombre: string
}

type FormularioCita = {
  // Datos de la cita (con y sin sesión)
  idMotivo: string
  idOdontologo: string
  idSucursal: string
  fecha: string
  hora: string
  motivo: string
  // Datos personales (solo sin sesión, según ReservaPublicaRequest)
  rut: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  telefono: string
  correo: string
}

type Resumen = {
  tipoAtencion: string
  fecha: string
  hora: string
  sucursal: string
  odontologo: string
}

const FORMULARIO_VACIO: FormularioCita = {
  idMotivo: '',
  idOdontologo: '',
  idSucursal: '',
  fecha: '',
  hora: '',
  motivo: '',
  rut: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  telefono: '',
  correo: '',
}

/** Fecha de hoy en formato AAAA-MM-DD (hora local). */
function hoyISO() {
  const ahora = new Date()
  return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

/** Lee el mensaje de error que envía el backend; si no hay, usa el texto por defecto. */
async function leerMensajeError(respuesta: Response, porDefecto: string) {
  try {
    const datos = await respuesta.json()
    const mensaje = typeof datos?.message === 'string' ? datos.message.trim() : ''
    if (!mensaje) return porDefecto
    // Errores de @Valid: el mensaje técnico no sirve al paciente
    if (mensaje.startsWith('Validation failed')) return 'Revisa los datos ingresados.'
    return mensaje
  } catch {
    return porDefecto
  }
}

/* =========================================================
   PÁGINA
========================================================= */

function ReservarCita() {
  const navigate = useNavigate()

  // Paciente con sesión iniciada: usa su cuenta. Cualquier otro caso: invitado.
  const token = localStorage.getItem('dentalsys_token')
  const rol = localStorage.getItem('dentalsys_rol')
  const conSesion = Boolean(token) && rol === 'PACIENTE'

  const [odontologos, setOdontologos] = useState<Odontologo[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [motivos, setMotivos] = useState<MotivoCita[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [formulario, setFormulario] = useState<FormularioCita>(FORMULARIO_VACIO)

  // Carga tipos de atención, odontólogos y sucursales (las tres listas son públicas en el backend)
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true)
        setError('')

        const [respuestaMotivos, respuestaOdontologos, respuestaSucursales] = await Promise.all([
          fetch(`${API_URL}/api/motivos-cita`),
          fetch(`${API_URL}/api/odontologos`),
          fetch(`${API_URL}/api/sucursales`),
        ])

        if (!respuestaMotivos.ok || !respuestaOdontologos.ok || !respuestaSucursales.ok) {
          throw new Error('Error al cargar los datos')
        }

        setMotivos(await respuestaMotivos.json())
        setOdontologos(await respuestaOdontologos.json())
        setSucursales(await respuestaSucursales.json())
      } catch (e) {
        console.error(e)
        setError('No fue posible cargar los tipos de atención, odontólogos y sucursales.')
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [])

  const manejarCambio = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  const reservarCita = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!formulario.idMotivo || !formulario.idOdontologo || !formulario.idSucursal
      || !formulario.fecha || !formulario.hora) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    if (!conSesion && (!formulario.rut.trim() || !formulario.nombres.trim()
      || !formulario.apellidos.trim() || !formulario.fechaNacimiento)) {
      setError('Completa tus datos personales.')
      return
    }

    // El backend solo acepta citas que comienzan en :00 o :30
    const minutos = formulario.hora.split(':')[1]
    if (minutos !== '00' && minutos !== '30') {
      setError('La hora debe comenzar en punto o y media (por ejemplo 10:00 o 10:30).')
      return
    }

    const fechaHora = `${formulario.fecha}T${formulario.hora}:00`

    const datosCita = {
      idMotivo: Number(formulario.idMotivo),
      idOdontologo: Number(formulario.idOdontologo),
      idSucursal: Number(formulario.idSucursal),
      fechaHora,
      motivo: formulario.motivo.trim(),
    }

    const url = conSesion
      ? `${API_URL}/api/citas/reservar`
      : `${API_URL}/api/citas/reserva-publica`

    const cuerpo = conSesion
      ? datosCita
      : {
          ...datosCita,
          rut: formulario.rut.trim(),
          nombres: formulario.nombres.trim(),
          apellidos: formulario.apellidos.trim(),
          fechaNacimiento: formulario.fechaNacimiento,
          telefono: formulario.telefono.trim() || null,
          correo: formulario.correo.trim() || null,
        }

    try {
      setGuardando(true)

      const respuesta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(conSesion ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(cuerpo),
      })

      if (conSesion && respuesta.status === 401) {
        localStorage.removeItem('dentalsys_token')
        navigate('/login', { replace: true })
        return
      }

      if (!respuesta.ok) {
        setError(await leerMensajeError(respuesta, 'No fue posible reservar la cita.'))
        return
      }

      // Resumen con los datos que eligió el paciente
      const motivo = motivos.find((m) => String(m.idMotivo) === formulario.idMotivo)
      const odontologo = odontologos.find((o) => String(o.idUsuario) === formulario.idOdontologo)
      const sucursal = sucursales.find((s) => String(s.idSucursal) === formulario.idSucursal)

      setResumen({
        tipoAtencion: motivo ? motivo.nombre : '',
        fecha: formulario.fecha.split('-').reverse().join('-'),
        hora: formulario.hora,
        sucursal: sucursal ? sucursal.nombre : '',
        odontologo: odontologo ? `${odontologo.nombres} ${odontologo.apellidos}` : '',
      })
      setFormulario(FORMULARIO_VACIO)
    } catch (e) {
      console.error(e)
      setError('No fue posible conectar con el servidor.')
    } finally {
      setGuardando(false)
    }
  }

  const bloqueado = cargando || guardando

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: C.surface, color: 'text.primary', fontFamily: theme.typography.fontFamily }}>
        {/* ---------- Encabezado oscuro ---------- */}
        <Box
          sx={{
            position: 'relative', overflow: 'hidden', color: '#fff', pt: 3, pb: { xs: 14, md: 16 },
            background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navy2} 100%)`,
          }}
        >
          <Box aria-hidden sx={{ position: 'absolute', top: -160, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,.5), transparent 65%)', filter: 'blur(20px)' }} />
          <Box aria-hidden sx={{ position: 'absolute', bottom: -200, left: -140, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,.25), transparent 65%)', filter: 'blur(20px)' }} />

          <Container maxWidth="md" sx={{ position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box onClick={() => navigate('/')} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: 3, display: 'grid', placeItems: 'center',
                    background: GRADIENT, boxShadow: '0 8px 24px -8px rgba(37,99,235,.7)',
                  }}
                >
                  <MedicalServicesOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>Más Dent</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.6)' }}>Portal de pacientes · DentalSys</Typography>
                </Box>
              </Box>

              <Button
                startIcon={<ArrowBackRoundedIcon />}
                onClick={() => navigate(conSesion ? '/portal' : '/')}
                sx={{ color: 'rgba(255,255,255,.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,.06)' } }}
              >
                {conSesion ? 'Volver al portal' : 'Volver al inicio'}
              </Button>
            </Box>

            <Typography variant="overline" sx={{ display: 'block', mt: { xs: 6, md: 8 }, color: C.cyan }}>
              Reserva de hora
            </Typography>
            <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: '2.2rem', md: '3rem' } }}>
              Reserva tu hora
            </Typography>
            <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,.72)', fontSize: '1.05rem', maxWidth: 560 }}>
              Selecciona el tipo de atención, odontólogo, sucursal, fecha y hora para solicitar una nueva atención.
            </Typography>
          </Container>
        </Box>

        {/* ---------- Tarjeta del formulario ---------- */}
        <Container maxWidth="md" sx={{ position: 'relative', mt: { xs: -10, md: -11 }, pb: 10 }}>
          <Card sx={{ p: { xs: 3, md: 5 }, boxShadow: '0 40px 80px -50px rgba(11,18,32,.45)' }}>
            {resumen ? (
              <ReservaExitosa
                resumen={resumen}
                conSesion={conSesion}
                onOtraReserva={() => setResumen(null)}
                onIr={(ruta) => navigate(ruta)}
              />
            ) : (
              <Box component="form" onSubmit={reservarCita} noValidate>
                {!conSesion && (
                  <Alert severity="info" icon={<PersonOutlineRoundedIcon />} sx={{ mb: 4, borderRadius: 3 }}>
                    ¿Ya tienes cuenta?{' '}
                    <Box
                      component="button"
                      type="button"
                      onClick={() => navigate('/login')}
                      sx={{
                        p: 0, border: 0, bgcolor: 'transparent', color: 'primary.main', fontWeight: 700,
                        font: 'inherit', cursor: 'pointer', textDecoration: 'underline',
                      }}
                    >
                      Inicia sesión
                    </Box>{' '}
                    para reservar con tus datos guardados.
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" sx={{ mb: 4, borderRadius: 3 }}>{error}</Alert>
                )}

                <Stack spacing={5}>
                  {/* Datos personales: solo sin sesión */}
                  {!conSesion && (
                    <Bloque numero={1} titulo="Tus datos">
                      <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth required label="RUT" name="rut" placeholder="12.345.678-5"
                            value={formulario.rut} onChange={manejarCambio} disabled={bloqueado}
                            slotProps={{ htmlInput: { maxLength: 12 } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth required label="Fecha de nacimiento" name="fechaNacimiento" type="date"
                            value={formulario.fechaNacimiento} onChange={manejarCambio} disabled={bloqueado}
                            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoyISO() } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth required label="Nombres" name="nombres"
                            value={formulario.nombres} onChange={manejarCambio} disabled={bloqueado}
                            slotProps={{ htmlInput: { maxLength: 100 } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth required label="Apellidos" name="apellidos"
                            value={formulario.apellidos} onChange={manejarCambio} disabled={bloqueado}
                            slotProps={{ htmlInput: { maxLength: 100 } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth label="Teléfono" name="telefono" type="tel"
                            value={formulario.telefono} onChange={manejarCambio} disabled={bloqueado}
                            slotProps={{ htmlInput: { maxLength: 20 } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField fullWidth label="Correo" name="correo" type="email"
                            value={formulario.correo} onChange={manejarCambio} disabled={bloqueado}
                            slotProps={{ htmlInput: { maxLength: 150 } }} />
                        </Grid>
                      </Grid>
                    </Bloque>
                  )}

                  {/* Datos de la cita */}
                  <Bloque numero={conSesion ? 1 : 2} titulo="Tu atención">
                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12 }}>
                        <TextField select fullWidth required label="Tipo de atención" name="idMotivo"
                          value={formulario.idMotivo} onChange={manejarCambio} disabled={bloqueado}>
                          {motivos.length === 0 ? (
                            <MenuItem disabled value="">No hay tipos de atención disponibles</MenuItem>
                          ) : (
                            motivos.map((m) => (
                              <MenuItem key={m.idMotivo} value={String(m.idMotivo)}>{m.nombre}</MenuItem>
                            ))
                          )}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField select fullWidth required label="Odontólogo" name="idOdontologo"
                          value={formulario.idOdontologo} onChange={manejarCambio} disabled={bloqueado}>
                          {odontologos.length === 0 ? (
                            <MenuItem disabled value="">No hay odontólogos disponibles</MenuItem>
                          ) : (
                            odontologos.map((o) => (
                              <MenuItem key={o.idUsuario} value={String(o.idUsuario)}>
                                {o.nombres} {o.apellidos}{o.especialidad ? ` - ${o.especialidad}` : ''}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField select fullWidth required label="Sucursal" name="idSucursal"
                          value={formulario.idSucursal} onChange={manejarCambio} disabled={bloqueado}>
                          {sucursales.length === 0 ? (
                            <MenuItem disabled value="">No hay sucursales disponibles</MenuItem>
                          ) : (
                            sucursales.map((s) => (
                              <MenuItem key={s.idSucursal} value={String(s.idSucursal)}>
                                {s.nombre} - {s.direccion}
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Fecha" name="fecha" type="date"
                          value={formulario.fecha} onChange={manejarCambio} disabled={guardando}
                          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: hoyISO() } }} />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField fullWidth required label="Hora" name="hora" type="time"
                          helperText="Las horas comienzan en punto o y media"
                          value={formulario.hora} onChange={manejarCambio} disabled={guardando}
                          slotProps={{ inputLabel: { shrink: true }, htmlInput: { step: 1800 } }} />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField fullWidth multiline minRows={3} label="Comentario adicional (opcional)" name="motivo"
                          placeholder="Si quieres, agrega algún detalle para el odontólogo"
                          value={formulario.motivo} onChange={manejarCambio} disabled={guardando}
                          slotProps={{ htmlInput: { maxLength: 255 } }} />
                      </Grid>
                    </Grid>
                  </Bloque>
                </Stack>

                {/* Botones */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 5, justifyContent: 'flex-end' }}>
                  {conSesion ? (
                    <>
                      <Button variant="outlined" size="large" onClick={() => navigate('/portal')} disabled={guardando}>
                        Volver al portal
                      </Button>
                      <Button variant="outlined" size="large" onClick={() => navigate('/portal/citas')} disabled={guardando}>
                        Ver mis citas
                      </Button>
                    </>
                  ) : (
                    <Button variant="outlined" size="large" onClick={() => navigate('/')} disabled={guardando}>
                      Volver al inicio
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={bloqueado}
                    sx={{ background: GRADIENT, boxShadow: '0 16px 36px -14px rgba(37,99,235,.8)' }}
                  >
                    {guardando ? 'Reservando...' : 'Reservar cita'}
                  </Button>
                </Stack>
              </Box>
            )}
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

/** Grupo de campos con número y título. */
function Bloque({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Box
          sx={{
            width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center',
            background: GRADIENT, color: '#fff', fontSize: '.85rem', fontWeight: 800,
          }}
        >
          {numero}
        </Box>
        <Typography variant="h6">{titulo}</Typography>
      </Box>
      {children}
    </Box>
  )
}

/** Mensaje de reserva exitosa con los datos que eligió el paciente. */
function ReservaExitosa({
  resumen, conSesion, onOtraReserva, onIr,
}: {
  resumen: Resumen
  conSesion: boolean
  onOtraReserva: () => void
  onIr: (ruta: string) => void
}) {
  const filas: [string, string][] = [
    ['Tipo de atención', resumen.tipoAtencion],
    ['Fecha', resumen.fecha],
    ['Hora', resumen.hora],
    ['Sucursal', resumen.sucursal],
    ['Odontólogo', resumen.odontologo],
  ]

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Box
        sx={{
          width: 72, height: 72, mx: 'auto', borderRadius: '50%', display: 'grid', placeItems: 'center',
          bgcolor: C.tint, color: 'primary.main',
        }}
      >
        <CheckCircleRoundedIcon sx={{ fontSize: 40 }} />
      </Box>
      <Typography variant="h2" sx={{ mt: 3, fontSize: { xs: '1.75rem', md: '2.2rem' } }}>
        La cita fue reservada correctamente
      </Typography>

      <Box sx={{ mt: 4, mx: 'auto', maxWidth: 420, textAlign: 'left', border: `1px solid ${C.line}`, borderRadius: 4, overflow: 'hidden' }}>
        {filas.map(([etiqueta, valor]) => (
          <Box
            key={etiqueta}
            sx={{
              display: 'flex', justifyContent: 'space-between', gap: 2, px: 2.5, py: 1.75,
              borderBottom: `1px solid ${C.line}`, '&:last-of-type': { borderBottom: 'none' },
            }}
          >
            <Typography sx={{ color: 'text.secondary' }}>{etiqueta}</Typography>
            <Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{valor}</Typography>
          </Box>
        ))}
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 5, justifyContent: 'center' }}>
        <Button variant="outlined" size="large" startIcon={<EventAvailableOutlinedIcon />} onClick={onOtraReserva}>
          Reservar otra hora
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={() => onIr(conSesion ? '/portal/citas' : '/')}
          sx={{ background: GRADIENT }}
        >
          {conSesion ? 'Ver mis citas' : 'Volver al inicio'}
        </Button>
      </Stack>
    </Box>
  )
}

export default ReservarCita