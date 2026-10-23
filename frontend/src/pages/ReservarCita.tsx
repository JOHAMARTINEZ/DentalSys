import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:8080'

type Odontologo = {
  idUsuario: number
  nombres: string
  apellidos: string
  especialidad?: string
}

type FormularioCita = {
  idOdontologo: string
  fecha: string
  hora: string
  motivo: string
}

function ReservarCita() {
  const navigate = useNavigate()

  const [odontologos, setOdontologos] = useState<Odontologo[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [formulario, setFormulario] = useState<FormularioCita>({
    idOdontologo: '',
    fecha: '',
    hora: '',
    motivo: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('dentalsys_token')
    const rol = localStorage.getItem('dentalsys_rol')

    if (!token || rol !== 'PACIENTE') {
      navigate('/login', { replace: true })
      return
    }

    const cargarOdontologos = async () => {
      try {
        setCargando(true)
        setError('')

        const respuesta = await fetch(`${API_URL}/api/odontologos`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!respuesta.ok) {
          throw new Error('No fue posible cargar los odontólogos.')
        }

        const datos = await respuesta.json()
        setOdontologos(datos)
      } catch (error) {
        console.error(error)
        setError('No fue posible cargar los odontólogos.')
      } finally {
        setCargando(false)
      }
    }

    cargarOdontologos()
  }, [navigate])

  const manejarCambio = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  const reservarCita = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    setError('')
    setMensaje('')

    if (
      !formulario.idOdontologo ||
      !formulario.fecha ||
      !formulario.hora
    ) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    const token = localStorage.getItem('dentalsys_token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    try {
      setGuardando(true)

      const fechaHora = `${formulario.fecha}T${formulario.hora}:00`

      const respuesta = await fetch(`${API_URL}/api/citas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idOdontologo: Number(formulario.idOdontologo),
          fechaHora,
          motivo: formulario.motivo.trim(),
        }),
      })

      if (respuesta.status === 401) {
        localStorage.removeItem('dentalsys_token')
        navigate('/login', { replace: true })
        return
      }

      if (respuesta.status === 409) {
        setError(
          'El horario seleccionado ya no está disponible. Elige otro horario.',
        )
        return
      }

      if (respuesta.status === 403) {
        setError(
          'No tienes permisos para reservar una cita.',
        )
        return
      }

      if (!respuesta.ok) {
        setError('No fue posible reservar la cita.')
        return
      }

      setMensaje('La cita fue reservada correctamente.')

      setFormulario({
        idOdontologo: '',
        fecha: '',
        hora: '',
        motivo: '',
      })
    } catch (error) {
      console.error(error)
      setError(
        'No fue posible conectar con el servidor.',
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f7f9fc',
        p: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          maxWidth: 800,
          mx: 'auto',
        }}
      >
        <Stack spacing={1} sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              color: '#263238',
              fontWeight: 700,
            }}
          >
            Reservar cita
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
          >
            Selecciona un odontólogo, fecha y hora para solicitar
            una nueva atención.
          </Typography>
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {mensaje && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
          >
            {mensaje}
          </Alert>
        )}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid #e3e8ef',
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box
              component="form"
              onSubmit={reservarCita}
            >
              <Stack spacing={3}>
                <TextField
                  select
                  fullWidth
                  label="Odontólogo"
                  name="idOdontologo"
                  value={formulario.idOdontologo}
                  onChange={manejarCambio}
                  disabled={cargando || guardando}
                  required
                >
                  {odontologos.length === 0 ? (
                    <MenuItem disabled value="">
                      No hay odontólogos disponibles
                    </MenuItem>
                  ) : (
                    odontologos.map((odontologo) => (
                      <MenuItem
                        key={odontologo.idUsuario}
                        value={odontologo.idUsuario}
                      >
                        {odontologo.nombres}{' '}
                        {odontologo.apellidos}
                        {odontologo.especialidad
                          ? ` - ${odontologo.especialidad}`
                          : ''}
                      </MenuItem>
                    ))
                  )}
                </TextField>

                <TextField
                  fullWidth
                  label="Fecha"
                  name="fecha"
                  type="date"
                  value={formulario.fecha}
                  onChange={manejarCambio}
                  disabled={guardando}
                  required
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Hora"
                  name="hora"
                  type="time"
                  value={formulario.hora}
                  onChange={manejarCambio}
                  disabled={guardando}
                  required
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label="Motivo de la consulta"
                  name="motivo"
                  value={formulario.motivo}
                  onChange={manejarCambio}
                  disabled={guardando}
                  placeholder="Indica brevemente el motivo de tu consulta"
                />

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{
                    justifyContent: 'flex-end',
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/portal')}
                    disabled={guardando}
                  >
                    Volver al portal
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() =>
                      navigate('/portal/citas')
                    }
                    disabled={guardando}
                  >
                    Ver mis citas
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={guardando || cargando}
                  >
                    {guardando
                      ? 'Reservando...'
                      : 'Reservar cita'}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default ReservarCita