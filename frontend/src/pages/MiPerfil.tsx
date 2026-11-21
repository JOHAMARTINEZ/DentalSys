import { useCallback, useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined'

import { apiGet, apiPut, getUsuarioSesion, mensajeError } from '../services/api'

/* =========================================================
   MI PERFIL (portal del paciente)
   - Datos de contacto (teléfono, correo, dirección).
   - Cambio de contraseña.
   - Preferencias de notificación con consentimiento
     (tabla preferencia_notificacion).
========================================================= */

const GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)'

interface Perfil {
  rut: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  telefono: string | null
  correo: string | null
  direccion: string | null
  username: string
  emailHabilitado: boolean
  whatsappHabilitado: boolean
  canalPreferido: 'EMAIL' | 'WHATSAPP' | null
  fechaConsentimientoEmail: string | null
  fechaConsentimientoWhatsapp: string | null
}

function MiPerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const [telefono, setTelefono] = useState('')
  const [correo, setCorreo] = useState('')
  const [direccion, setDireccion] = useState('')
  const [errorDatos, setErrorDatos] = useState('')
  const [guardandoDatos, setGuardandoDatos] = useState(false)

  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [errorClave, setErrorClave] = useState('')
  const [guardandoClave, setGuardandoClave] = useState(false)

  const [email, setEmail] = useState(false)
  const [whatsapp, setWhatsapp] = useState(false)
  const [canal, setCanal] = useState<'' | 'EMAIL' | 'WHATSAPP'>('')
  const [errorNotif, setErrorNotif] = useState('')
  const [guardandoNotif, setGuardandoNotif] = useState(false)

  const aplicar = (p: Perfil) => {
    setPerfil(p)
    setTelefono(p.telefono ?? '')
    setCorreo(p.correo ?? '')
    setDireccion(p.direccion ?? '')
    setEmail(p.emailHabilitado)
    setWhatsapp(p.whatsappHabilitado)
    setCanal(p.canalPreferido ?? '')
  }

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      aplicar(await apiGet<Perfil>('/api/portal/perfil'))
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar tu perfil.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  const guardarDatos = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.trim())) { setErrorDatos('Ingresa un correo válido.'); return }
    setGuardandoDatos(true)
    setErrorDatos('')
    try {
      const p = await apiPut<Perfil>('/api/portal/perfil', { telefono: telefono.trim() || null, correo: correo.trim(), direccion: direccion.trim() || null })
      aplicar(p)
      // Mantiene el correo de la sesión al día
      const sesion = getUsuarioSesion()
      localStorage.setItem('dentalsys_usuario', JSON.stringify({ ...sesion, correo: p.correo }))
      setAviso('Datos actualizados.')
    } catch (err) {
      setErrorDatos(mensajeError(err))
    } finally {
      setGuardandoDatos(false)
    }
  }

  const cambiarClave = async () => {
    if (nueva.length < 8) { setErrorClave('La nueva contraseña debe tener al menos 8 caracteres.'); return }
    if (nueva !== repetir) { setErrorClave('Las contraseñas nuevas no coinciden.'); return }
    setGuardandoClave(true)
    setErrorClave('')
    try {
      await apiPut('/api/portal/clave', { actual, nueva })
      setActual('')
      setNueva('')
      setRepetir('')
      setAviso('Contraseña actualizada.')
    } catch (err) {
      setErrorClave(mensajeError(err))
    } finally {
      setGuardandoClave(false)
    }
  }

  const guardarNotificaciones = async () => {
    setGuardandoNotif(true)
    setErrorNotif('')
    try {
      aplicar(await apiPut<Perfil>('/api/portal/notificaciones', {
        emailHabilitado: email,
        whatsappHabilitado: whatsapp,
        canalPreferido: canal || null,
      }))
      setAviso('Preferencias guardadas.')
    } catch (err) {
      setErrorNotif(mensajeError(err))
    } finally {
      setGuardandoNotif(false)
    }
  }

  if (cargando) return <Skeleton variant="rounded" height={420} sx={{ borderRadius: 5 }} />

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      {perfil && (
        <>
          {/* ===== Datos ===== */}
          <Card sx={{ p: { xs: 2.5, sm: 3.5 }, boxShadow: '0 40px 80px -50px rgba(11,18,32,.45)' }}>
            <Typography variant="h6">Mis datos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Tu nombre, RUT y fecha de nacimiento solo los puede corregir la clínica.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><TextField label="Nombre" value={`${perfil.nombres} ${perfil.apellidos}`} disabled /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><TextField label="RUT" value={perfil.rut} disabled /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><TextField label="Nacimiento" value={new Date(`${perfil.fechaNacimiento}T00:00:00`).toLocaleDateString('es-CL')} disabled /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><TextField label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="+56 9 1234 5678" slotProps={{ htmlInput: { maxLength: 20 } }} /></Grid>
              <Grid size={{ xs: 12, sm: 8 }}><TextField label="Correo" type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} slotProps={{ htmlInput: { maxLength: 150 } }} /></Grid>
              <Grid size={{ xs: 12 }}><TextField label="Dirección" value={direccion} onChange={(e) => setDireccion(e.target.value)} slotProps={{ htmlInput: { maxLength: 200 } }} /></Grid>
            </Grid>
            {errorDatos && <Alert severity="error" sx={{ mt: 2 }}>{errorDatos}</Alert>}
            <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => void guardarDatos()} disabled={guardandoDatos} sx={{ mt: 2.5, background: GRADIENT }}>
              {guardandoDatos ? <CircularProgress size={20} color="inherit" /> : 'Guardar datos'}
            </Button>
          </Card>

          <Grid container spacing={3}>
            {/* ===== Notificaciones ===== */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: { xs: 2.5, sm: 3.5 }, height: '100%' }}>
                <Typography variant="h6">Notificaciones</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Elige por dónde quieres recibir avisos de tus citas y pagos. Al activar un canal das tu consentimiento para recibir mensajes por esa vía.
                </Typography>
                <Stack spacing={1}>
                  <FormControlLabel
                    control={<Switch checked={email} onChange={(e) => { setEmail(e.target.checked); if (!e.target.checked && canal === 'EMAIL') setCanal('') }} />}
                    label={<Box><Typography sx={{ fontWeight: 600 }}>Correo electrónico</Typography>{perfil.fechaConsentimientoEmail && perfil.emailHabilitado && <Typography variant="caption" color="text.secondary">Autorizado el {new Date(perfil.fechaConsentimientoEmail).toLocaleDateString('es-CL')}</Typography>}</Box>}
                  />
                  <FormControlLabel
                    control={<Switch checked={whatsapp} onChange={(e) => { setWhatsapp(e.target.checked); if (!e.target.checked && canal === 'WHATSAPP') setCanal('') }} />}
                    label={<Box><Typography sx={{ fontWeight: 600 }}>WhatsApp</Typography>{perfil.fechaConsentimientoWhatsapp && perfil.whatsappHabilitado && <Typography variant="caption" color="text.secondary">Autorizado el {new Date(perfil.fechaConsentimientoWhatsapp).toLocaleDateString('es-CL')}</Typography>}</Box>}
                  />
                  <TextField select label="Canal preferido" value={canal} onChange={(e) => setCanal(e.target.value as '' | 'EMAIL' | 'WHATSAPP')} sx={{ mt: 1 }}>
                    <MenuItem value="">Sin preferencia</MenuItem>
                    <MenuItem value="EMAIL" disabled={!email}>Correo electrónico</MenuItem>
                    <MenuItem value="WHATSAPP" disabled={!whatsapp}>WhatsApp</MenuItem>
                  </TextField>
                </Stack>
                {errorNotif && <Alert severity="error" sx={{ mt: 2 }}>{errorNotif}</Alert>}
                <Button variant="outlined" onClick={() => void guardarNotificaciones()} disabled={guardandoNotif} sx={{ mt: 2.5 }}>
                  {guardandoNotif ? <CircularProgress size={20} /> : 'Guardar preferencias'}
                </Button>
              </Card>
            </Grid>

            {/* ===== Contraseña ===== */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: { xs: 2.5, sm: 3.5 }, height: '100%' }}>
                <Typography variant="h6">Contraseña</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Usuario: <strong>{perfil.username}</strong>
                </Typography>
                <Stack spacing={2}>
                  <TextField label="Contraseña actual" type="password" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" />
                  <TextField label="Nueva contraseña" type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} helperText="Mínimo 8 caracteres" autoComplete="new-password" slotProps={{ htmlInput: { maxLength: 72 } }} />
                  <TextField label="Repite la nueva contraseña" type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" slotProps={{ htmlInput: { maxLength: 72 } }} />
                </Stack>
                {errorClave && <Alert severity="error" sx={{ mt: 2 }}>{errorClave}</Alert>}
                <Button variant="outlined" startIcon={<LockResetOutlinedIcon />} onClick={() => void cambiarClave()} disabled={guardandoClave || !actual || !nueva} sx={{ mt: 2.5 }}>
                  {guardandoClave ? <CircularProgress size={20} /> : 'Cambiar contraseña'}
                </Button>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      <Snackbar open={Boolean(aviso)} autoHideDuration={3500} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>{aviso}</Alert>
      </Snackbar>
    </Stack>
  )
}

export default MiPerfil
