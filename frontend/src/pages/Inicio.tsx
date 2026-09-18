import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  Stack,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '../services/api'

type HealthResponse = {
  status: string
  application: string
}

const resumen = [
  {
    titulo: 'Pacientes registrados',
    valor: '128',
    icono: <PeopleIcon />,
  },
  {
    titulo: 'Citas de hoy',
    valor: '12',
    icono: <CalendarMonthIcon />,
  },
  {
    titulo: 'Presupuestos pendientes',
    valor: '8',
    icono: <RequestQuoteIcon />,
  },
  {
    titulo: 'Atenciones del día',
    valor: '10',
    icono: <MedicalServicesIcon />,
  },
]

const proximasCitas = [
  {
    hora: '10:00',
    paciente: 'María González',
    motivo: 'Control dental',
  },
  {
    hora: '11:30',
    paciente: 'Carlos Pérez',
    motivo: 'Limpieza dental',
  },
  {
    hora: '14:00',
    paciente: 'Ana Martínez',
    motivo: 'Evaluación',
  },
]

function Inicio() {
  const navigate = useNavigate()
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<HealthResponse>('/api/health')
      .then(setHealth)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
          }}
        >
          Bienvenido a DentalSys
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Resumen general de la gestión de la clínica dental.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {resumen.map((item) => (
          <Grid key={item.titulo} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
               <Stack
                  direction="row"
                  sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  }}
                  >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {item.titulo}
                    </Typography>

                    <Typography
                      variant="h4"
                      sx={{
                        mt: 1,
                        fontWeight: 700,
                      }}
                    >
                      {item.valor}
                    </Typography>
                  </Box>

                  {item.icono}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                }}
              >
                Próximas citas
              </Typography>

              <Stack spacing={2}>
                {proximasCitas.map((cita) => (
                  <Box
                    key={`${cita.hora}-${cita.paciente}`}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                        }}
                      >
                        {cita.paciente}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {cita.motivo}
                      </Typography>
                    </Box>

                    <Chip label={cita.hora} />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                }}
              >
                Accesos rápidos
              </Typography>

              <Stack spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/pacientes')}
                >
                  Gestionar pacientes
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate('/agenda')}
                >
                  Revisar agenda
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate('/ficha-clinica')}
                >
                  Fichas clínicas
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate('/presupuestos')}
                >
                  Presupuestos
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                Estado del sistema
              </Typography>

              {health && (
                <Typography sx={{ mt: 1 }}>
                  Backend conectado: {health.application} — estado:{' '}
                  {health.status}
                </Typography>
              )}

              {error && (
                <Typography
                  color="error"
                  sx={{ mt: 1 }}
                >
                  Error de conexión: {error}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Inicio