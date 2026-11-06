import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'

import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'

import { useNavigate } from 'react-router-dom'

function PortalPaciente() {
  const navigate = useNavigate()

  const usuario = localStorage.getItem('dentalsys_usuario')

  let nombrePaciente = 'Paciente'

  if (usuario) {
    try {
      const datosUsuario = JSON.parse(usuario)

      nombrePaciente =
        datosUsuario.nombres ||
        datosUsuario.nombre ||
        'Paciente'
    } catch {
      nombrePaciente = 'Paciente'
    }
  }

  const cerrarSesion = () => {
    localStorage.removeItem('dentalsys_token')
    localStorage.removeItem('dentalsys_username')
    localStorage.removeItem('dentalsys_rol')
    localStorage.removeItem('dentalsys_usuario')

    navigate('/login', { replace: true })
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
          maxWidth: 1100,
          mx: 'auto',
        }}
      >
        {/* Encabezado */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            mb: 4,
            justifyContent: 'space-between',
            alignItems: {
              xs: 'flex-start',
              sm: 'center',
            },
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: '#263238',
                mb: 1,
                fontWeight: 700,
              }}
            >
              Portal del Paciente
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
            >
              Bienvenido/a, {nombrePaciente}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<LogoutOutlinedIcon />}
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </Button>
        </Stack>

        {/* Introducción */}
        <Card
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 3,
            border: '1px solid #e3e8ef',
          }}
        >
          <CardContent
            sx={{
              p: { xs: 3, md: 4 },
            }}
          >
            <Typography
              variant="h5"
              sx={{
                mb: 1,
                color: '#263238',
                fontWeight: 600,
              }}
            >
              ¿Qué deseas hacer?
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
            >
              Desde tu portal puedes revisar tus citas y reservar
              una nueva atención odontológica.
            </Typography>
          </CardContent>
        </Card>

        {/* Opciones del portal */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid #e3e8ef',
                transition: '0.2s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow:
                    '0 8px 24px rgba(0,0,0,0.08)',
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <EventNoteOutlinedIcon
                  sx={{
                    fontSize: 48,
                    color: '#1976d2',
                    mb: 2,
                  }}
                />

                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                  }}
                >
                  Mis citas
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Consulta tus próximas citas y revisa tu
                  historial de atenciones.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() =>
                    navigate('/portal/citas')
                  }
                >
                  Ver mis citas
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid #e3e8ef',
                transition: '0.2s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow:
                    '0 8px 24px rgba(0,0,0,0.08)',
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <CalendarMonthOutlinedIcon
                  sx={{
                    fontSize: 48,
                    color: '#1976d2',
                    mb: 2,
                  }}
                />

                <Typography
                  variant="h6"
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                  }}
                >
                  Reservar una cita
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Selecciona un odontólogo, fecha y hora para
                  solicitar una nueva atención.
                </Typography>

                <Button
                  variant="contained"
                  onClick={() =>
                    navigate('/portal/reservar-cita')
                  }
                >
                  Reservar cita
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default PortalPaciente
