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
  Avatar,
} from '@mui/material'

import PeopleIcon from '@mui/icons-material/People'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import MedicalInformationOutlinedIcon from '@mui/icons-material/MedicalInformationOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

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
    color: '#2563EB',
    background: '#EEF5FF',
  },
  {
    titulo: 'Citas de hoy',
    valor: '12',
    icono: <CalendarMonthIcon />,
    color: '#2563EB',
    background: '#EEF5FF',
  },
  {
    titulo: 'Presupuestos pendientes',
    valor: '8',
    icono: <RequestQuoteIcon />,
    color: '#2563EB',
    background: '#EEF5FF',
  },
  {
    titulo: 'Atenciones del día',
    valor: '10',
    icono: <MedicalServicesIcon />,
    color: '#2563EB',
    background: '#EEF5FF',
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
      {/* Encabezado */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
          }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: 46,
              height: 46,
              backgroundColor: '#EEF5FF',
              color: '#2563EB',
            }}
          >
            <MedicalInformationOutlinedIcon fontSize="medium" />
          </Avatar>

          <Typography
            sx={{
              fontSize: { xs: '1.7rem', sm: '2rem' },
              fontWeight: 800,
              color: '#1F2937',
            }}
          >
            Bienvenido a DentalSys
          </Typography>
        </Stack>

        <Typography
          sx={{
            mt: 0.8,
            color: '#6B7280',
            fontSize: '0.98rem',
          }}
        >
          Resumen general de la gestión de la clínica dental.
        </Typography>
      </Box>

      {/* Tarjetas de resumen */}
      <Grid container spacing={2.5}>
        {resumen.map((item) => (
          <Grid
            key={item.titulo}
            size={{ xs: 12, sm: 6, md: 3 }}
          >
            <Card
              elevation={0}
              sx={{
                height: '100%',
                border: '1px solid #E5E7EB',
                borderRadius: 3,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow:
                    '0 8px 24px rgba(15, 23, 42, 0.08)',
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: '#6B7280',
                        fontSize: '0.84rem',
                        fontWeight: 500,
                      }}
                    >
                      {item.titulo}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 1,
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: '#1F2937',
                      }}
                    >
                      {item.valor}
                    </Typography>
                  </Box>

                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 44,
                      height: 44,
                      backgroundColor: item.background,
                      color: item.color,
                    }}
                  >
                    {item.icono}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Próximas citas */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #E5E7EB',
              borderRadius: 3,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2.5,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontWeight: 750,
                      fontSize: '1.1rem',
                      color: '#1F2937',
                    }}
                  >
                    Próximas citas
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.4,
                      color: '#9CA3AF',
                    }}
                  >
                    Agenda de hoy
                  </Typography>
                </Box>

                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() =>
                    navigate('/gestion/agenda')
                  }
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#2563EB',
                  }}
                >
                  Ver agenda
                </Button>
              </Box>

              <Stack spacing={1.2}>
                {proximasCitas.map((cita) => (
                  <Box
                    key={`${cita.hora}-${cita.paciente}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <Chip
                      label={cita.hora}
                      size="small"
                      sx={{
                        minWidth: 58,
                        fontWeight: 700,
                        backgroundColor: '#EEF5FF',
                        color: '#2563EB',
                      }}
                    />

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 650,
                          color: '#1F2937',
                        }}
                      >
                        {cita.paciente}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: '#6B7280',
                          mt: 0.2,
                        }}
                      >
                        {cita.motivo}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Accesos rápidos */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #E5E7EB',
              borderRadius: 3,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                sx={{
                  fontWeight: 750,
                  fontSize: '1.1rem',
                  color: '#1F2937',
                }}
              >
                Accesos rápidos
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  mt: 0.4,
                  mb: 2.5,
                  color: '#9CA3AF',
                }}
              >
                Accede rápidamente a los módulos principales.
              </Typography>

              <Stack spacing={1.2}>
                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() =>
                    navigate('/gestion/pacientes')
                  }
                  sx={{
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 1.1,
                  }}
                >
                  Gestionar pacientes
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() =>
                    navigate('/gestion/agenda')
                  }
                  sx={{
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 1.1,
                  }}
                >
                  Revisar agenda
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() =>
                    navigate('/gestion/ficha-clinica')
                  }
                  sx={{
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 1.1,
                  }}
                >
                  Fichas clínicas
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() =>
                    navigate('/gestion/presupuestos')
                  }
                  sx={{
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 1.1,
                  }}
                >
                  Presupuestos
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Estado del sistema */}
        <Grid size={{ xs: 12 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid #E5E7EB',
              borderRadius: 3,
              backgroundColor: '#FFFFFF',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <CheckCircleIcon
                  sx={{
                    color: health ? '#2563EB' : '#9CA3AF',
                  }}
                />

                <Box>
                  <Typography
                    sx={{
                      fontWeight: 650,
                      color: '#1F2937',
                    }}
                  >
                    Estado del sistema
                  </Typography>

                  {health && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#6B7280',
                        mt: 0.3,
                      }}
                    >
                      Backend conectado: {health.application} ·
                      Estado: {health.status}
                    </Typography>
                  )}

                  {error && (
                    <Typography
                      variant="body2"
                      color="error"
                      sx={{ mt: 0.3 }}
                    >
                      Error de conexión: {error}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Inicio
