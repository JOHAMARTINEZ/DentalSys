import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'

const API_URL = 'http://localhost:8080'

type Cita = {
  idCita: number
  fechaHora: string
  motivo?: string
  estado: string
  idOdontologo: number
  correoOdontologo?: string
}

type Odontologo = {
  idUsuario: number
  nombres: string
  apellidos: string
  especialidad?: string
}

const coloresEstado: Record<
  string,
  'warning' | 'success' | 'error' | 'info' | 'default'
> = {
  PENDIENTE: 'warning',
  CONFIRMADA: 'success',
  CANCELADA: 'error',
  COMPLETADA: 'info',
  NO_ASISTE: 'default',
}

const nombresEstado: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
  NO_ASISTE: 'No asistió',
}

function MisCitas() {
  const navigate = useNavigate()

  const [citas, setCitas] = useState<Cita[]>([])
  const [odontologos, setOdontologos] = useState<Odontologo[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const cargarDatos = async () => {
      const token = localStorage.getItem('dentalsys_token')
      const rol = localStorage.getItem('dentalsys_rol')

      if (!token || rol !== 'PACIENTE') {
        navigate('/login', { replace: true })
        return
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        }

        const [respuestaCitas, respuestaOdontologos] = await Promise.all([
          fetch(`${API_URL}/api/citas/mis-citas`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_URL}/api/odontologos`, {
            headers,
            signal: controller.signal,
          }),
        ])

        if (
          respuestaCitas.status === 401 ||
          respuestaOdontologos.status === 401
        ) {
          localStorage.removeItem('dentalsys_token')
          localStorage.removeItem('dentalsys_username')
          localStorage.removeItem('dentalsys_rol')

          navigate('/login', { replace: true })
          return
        }

        if (!respuestaCitas.ok) {
          throw new Error('No fue posible consultar tus citas.')
        }

        const datosCitas: unknown = await respuestaCitas.json()

        if (Array.isArray(datosCitas)) {
          setCitas(datosCitas as Cita[])
        } else {
          setCitas([])
        }

        if (respuestaOdontologos.ok) {
          const datosOdontologos: unknown =
            await respuestaOdontologos.json()

          if (Array.isArray(datosOdontologos)) {
            setOdontologos(datosOdontologos as Odontologo[])
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(
            err.message || 'Ocurrió un error al cargar las citas.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false)
        }
      }
    }

    cargarDatos()

    return () => {
      controller.abort()
    }
  }, [navigate])

  const formatearFecha = (fechaHora: string) => {
    const fecha = new Date(fechaHora)

    if (Number.isNaN(fecha.getTime())) {
      return fechaHora
    }

    return fecha.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const obtenerNombreOdontologo = (cita: Cita) => {
    const odontologo = odontologos.find(
      (item) => item.idUsuario === cita.idOdontologo,
    )

    if (odontologo) {
      const nombre = [
        odontologo.nombres,
        odontologo.apellidos,
      ]
        .filter(Boolean)
        .join(' ')

      if (nombre) {
        return odontologo.especialidad
          ? `${nombre} — ${odontologo.especialidad}`
          : nombre
      }
    }

    return (
      cita.correoOdontologo ||
      `Odontólogo #${cita.idOdontologo}`
    )
  }

  const citasOrdenadas = [...citas].sort(
    (a, b) =>
      new Date(a.fechaHora).getTime() -
      new Date(b.fechaHora).getTime(),
  )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#F7FAFE',
      }}
    >
      {/* HEADER */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          color: '#253858',
          borderBottom: '1px solid #E4E7EC',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Typography
              component={RouterLink}
              to="/"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                fontSize: '23px',
                fontWeight: 700,
              }}
            >
              🦷 Dental
              <Box
                component="span"
                sx={{
                  color: 'primary.main',
                }}
              >
                Sys
              </Box>
            </Typography>

            <Button
              component={RouterLink}
              to="/portal"
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
              }}
            >
              Portal del paciente
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      {/* CONTENIDO */}
      <Container
        maxWidth="md"
        sx={{
          py: {
            xs: 5,
            md: 8,
          },
        }}
      >
        {/* TÍTULO */}
        <Stack
          direction={{
            xs: 'column',
            sm: 'row',
          }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: {
              xs: 'flex-start',
              sm: 'center',
            },
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              Mis citas
            </Typography>

            <Typography color="text.secondary">
              Consulta tus horas registradas en Clínica Más Dent.
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to="/portal/reservar-cita"
            variant="contained"
            sx={{
              textTransform: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Reservar una hora
          </Button>
        </Stack>

        {/* CARGANDO */}
        {cargando && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* ERROR */}
        {!cargando && error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {/* SIN CITAS */}
        {!cargando &&
          !error &&
          citasOrdenadas.length === 0 && (
            <Card
              sx={{
                borderRadius: 3,
                textAlign: 'center',
              }}
            >
              <CardContent
                sx={{
                  py: 7,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 48,
                    mb: 2,
                  }}
                >
                  🗓️
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  Todavía no tienes citas registradas
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    mb: 3,
                  }}
                >
                  Puedes reservar tu primera atención dental.
                </Typography>

                <Button
                  component={RouterLink}
                  to="/portal/reservar-cita"
                  variant="contained"
                  sx={{
                    textTransform: 'none',
                  }}
                >
                  Reservar una hora
                </Button>
              </CardContent>
            </Card>
          )}

        {/* LISTA DE CITAS */}
        {!cargando &&
          !error &&
          citasOrdenadas.length > 0 && (
            <Stack spacing={2.5}>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: 13,
                }}
              >
                {citasOrdenadas.length === 1
                  ? 'Tienes 1 cita registrada.'
                  : `Tienes ${citasOrdenadas.length} citas registradas.`}
              </Typography>

              {citasOrdenadas.map((cita) => (
                <Card
                  key={cita.idCita}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid #E4E7EC',
                    boxShadow:
                      '0 5px 20px rgba(16,24,40,0.04)',
                  }}
                >
                  <CardContent
                    sx={{
                      p: 3,
                      '&:last-child': {
                        pb: 3,
                      },
                    }}
                  >
                    <Stack
                      direction={{
                        xs: 'column',
                        sm: 'row',
                      }}
                      spacing={2}
                      sx={{
                        justifyContent: 'space-between',
                        alignItems: {
                          xs: 'flex-start',
                          sm: 'center',
                        },
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          color="text.secondary"
                          sx={{
                            fontSize: 12,
                          }}
                        >
                          Cita #{cita.idCita}
                        </Typography>

                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            mt: 0.5,
                          }}
                        >
                          {cita.motivo || 'Atención dental'}
                        </Typography>
                      </Box>

                      <Chip
                        label={
                          nombresEstado[cita.estado] ||
                          cita.estado
                        }
                        color={
                          coloresEstado[cita.estado] ||
                          'default'
                        }
                        size="small"
                      />
                    </Stack>

                    <Stack spacing={1.5}>
                      <Typography
                        sx={{
                          fontSize: 14,
                        }}
                      >
                        <strong>Fecha y hora:</strong>{' '}
                        {formatearFecha(cita.fechaHora)}
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: 14,
                        }}
                      >
                        <strong>Profesional:</strong>{' '}
                        {obtenerNombreOdontologo(cita)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
      </Container>
    </Box>
  )
}

export default MisCitas