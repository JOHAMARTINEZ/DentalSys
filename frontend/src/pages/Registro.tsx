import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

import { API_URL, mensajeError } from '../services/api'

/* =========================================================
   REGISTRO DE CUENTA DE PACIENTE (público)
   POST /api/auth/registro y luego inicio de sesión automático.
   Si ya reservó antes sin cuenta, la cuenta se enlaza a su
   ficha por RUT (la fecha de nacimiento debe coincidir).
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
    overline: { fontWeight: 700, letterSpacing: '0.16em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { borderRadius: 999 } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: `1px solid ${C.line}`, borderRadius: 20 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, backgroundColor: '#fff' } } },
  },
})

interface Formulario {
  rut: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  telefono: string
  correo: string
  username: string
  password: string
  repetir: string
}

const VACIO: Formulario = {
  rut: '', nombres: '', apellidos: '', fechaNacimiento: '', telefono: '',
  correo: '', username: '', password: '', repetir: '',
}

function limpiarRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase()
}

function rutValido(rut: string): boolean {
  const limpio = limpiarRut(rut)
  if (!/^\d{1,8}[0-9K]$/.test(limpio)) return false
  const cuerpo = limpio.slice(0, -1)
  let suma = 0
  let multiplicador = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  const resto = 11 - (suma % 11)
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
  return limpio.slice(-1) === esperado
}

function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState<Formulario>(VACIO)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (error) setError('')
  }

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!rutValido(form.rut)) { setError('El RUT ingresado no es válido.'); return }
    if (!form.nombres.trim() || !form.apellidos.trim()) { setError('Ingresa tus nombres y apellidos.'); return }
    if (!form.fechaNacimiento) { setError('Ingresa tu fecha de nacimiento.'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.correo.trim())) { setError('Ingresa un correo válido.'); return }
    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(form.username.trim())) { setError('El usuario debe tener entre 3 y 50 caracteres (letras, números, punto o guion).'); return }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (form.password !== form.repetir) { setError('Las contraseñas no coinciden.'); return }

    setGuardando(true)
    setError('')
    try {
      const respuesta = await fetch(`${API_URL}/api/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rut: form.rut.trim(),
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          fechaNacimiento: form.fechaNacimiento,
          telefono: form.telefono.trim() || null,
          correo: form.correo.trim(),
          username: form.username.trim(),
          password: form.password,
        }),
      })

      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null) as { message?: string } | null
        throw new Error(datos?.message || 'No fue posible crear la cuenta.')
      }

      // Inicio de sesión automático con la cuenta recién creada
      const login = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: form.username.trim(), password: form.password }),
      })

      if (!login.ok) {
        navigate('/login', { replace: true })
        return
      }

      const datos = await login.json() as {
        token: string; username?: string; rol?: string; idUsuario?: number
        correo?: string; rut?: string; nombres?: string; apellidos?: string
      }

      localStorage.setItem('dentalsys_token', datos.token)
      localStorage.setItem('dentalsys_username', datos.username ?? form.username.trim())
      localStorage.setItem('dentalsys_rol', datos.rol ?? 'PACIENTE')
      localStorage.setItem('dentalsys_usuario', JSON.stringify({
        idUsuario: datos.idUsuario, username: datos.username, correo: datos.correo,
        rut: datos.rut, nombres: datos.nombres, apellidos: datos.apellidos, rol: datos.rol,
      }))

      navigate('/portal', { replace: true })
    } catch (err) {
      setError(mensajeError(err, 'No fue posible crear la cuenta.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: C.surface, fontFamily: theme.typography.fontFamily }}>
        <Box sx={{ position: 'relative', overflow: 'hidden', color: '#fff', pt: 3, pb: { xs: 14, md: 16 }, background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navy2} 100%)` }}>
          <Box aria-hidden sx={{ position: 'absolute', top: -160, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,.5), transparent 65%)', filter: 'blur(20px)' }} />
          <Container maxWidth="md" sx={{ position: 'relative' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box onClick={() => navigate('/')} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 3, display: 'grid', placeItems: 'center', background: GRADIENT }}>
                  <MedicalServicesOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>Más Dent</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.6)' }}>Portal de pacientes · DentalSys</Typography>
                </Box>
              </Box>
              <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/')} sx={{ color: 'rgba(255,255,255,.8)' }}>Volver al inicio</Button>
            </Stack>
            <Typography variant="overline" sx={{ display: 'block', mt: { xs: 6, md: 8 }, color: C.cyan }}>Crear cuenta</Typography>
            <Typography variant="h1" sx={{ mt: 1, fontSize: { xs: '2.2rem', md: '3rem' } }}>Tu cuenta de paciente</Typography>
            <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,.72)', maxWidth: 560 }}>
              Con tu cuenta puedes ver tus horas, atenciones, presupuestos y pagos.
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="md" sx={{ position: 'relative', mt: { xs: -10, md: -11 }, pb: 10 }}>
          <Card sx={{ p: { xs: 3, md: 5 }, boxShadow: '0 40px 80px -50px rgba(11,18,32,.45)' }}>
            <Box component="form" onSubmit={enviar} noValidate>
              <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3, borderRadius: 3 }}>
                Si ya te atendiste o reservaste en la clínica, usa el mismo RUT y fecha de nacimiento: tu cuenta se enlazará a tu ficha.
              </Alert>
              {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Tus datos</Typography>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="RUT" name="rut" placeholder="12.345.678-5" value={form.rut} onChange={cambiar} slotProps={{ htmlInput: { maxLength: 12 } }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Fecha de nacimiento" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={cambiar} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoyISO() } }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Nombres" name="nombres" value={form.nombres} onChange={cambiar} slotProps={{ htmlInput: { maxLength: 100 } }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Apellidos" name="apellidos" value={form.apellidos} onChange={cambiar} slotProps={{ htmlInput: { maxLength: 100 } }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Teléfono" name="telefono" type="tel" value={form.telefono} onChange={cambiar} slotProps={{ htmlInput: { maxLength: 20 } }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth required label="Correo" name="correo" type="email" value={form.correo} onChange={cambiar} slotProps={{ htmlInput: { maxLength: 150 } }} /></Grid>
              </Grid>

              <Typography variant="h6" sx={{ fontWeight: 700, mt: 4, mb: 2 }}>Acceso</Typography>
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth required label="Nombre de usuario" name="username" value={form.username} onChange={cambiar} autoComplete="username" slotProps={{ htmlInput: { maxLength: 50 } }} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth required label="Contraseña" name="password" type="password" value={form.password} onChange={cambiar} helperText="Mínimo 8 caracteres" autoComplete="new-password" slotProps={{ htmlInput: { maxLength: 72 } }} /></Grid>
                <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth required label="Repite la contraseña" name="repetir" type="password" value={form.repetir} onChange={cambiar} autoComplete="new-password" slotProps={{ htmlInput: { maxLength: 72 } }} /></Grid>
              </Grid>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 5, justifyContent: 'flex-end', alignItems: { sm: 'center' } }}>
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                  ¿Ya tienes cuenta?{' '}
                  <Box component="button" type="button" onClick={() => navigate('/login')} sx={{ p: 0, border: 0, bgcolor: 'transparent', color: 'primary.main', fontWeight: 700, font: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
                    Inicia sesión
                  </Box>
                </Typography>
                <Button type="submit" variant="contained" size="large" disabled={guardando} sx={{ background: GRADIENT, px: 4 }}>
                  {guardando ? <CircularProgress size={22} color="inherit" /> : 'Crear mi cuenta'}
                </Button>
              </Stack>
            </Box>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default Registro
