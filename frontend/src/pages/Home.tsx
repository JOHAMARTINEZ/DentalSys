import { useNavigate } from 'react-router-dom'

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined'
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'

function Home() {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}
    >
      {/* HEADER */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          color: '#1f2937',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              minHeight: 76,
              justifyContent: 'space-between',
            }}
          >
            {/* LOGO */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  backgroundColor: '#0f766e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MedicalServicesOutlinedIcon
                  sx={{
                    color: '#ffffff',
                    fontSize: 25,
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#0f172a',
                    lineHeight: 1.1,
                  }}
                >
                  DentalSys
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                  }}
                >
                  Gestión odontológica
                </Typography>
              </Box>
            </Box>

            {/* MENU */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Button
                sx={{
                  color: '#475569',
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Inicio
              </Button>

              <Button
                sx={{
                  color: '#475569',
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Servicios
              </Button>

              <Button
                sx={{
                  color: '#475569',
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                DentalSys
              </Button>

              <Button
                sx={{
                  color: '#475569',
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Clínica
              </Button>

              <Button
                sx={{
                  color: '#475569',
                  textTransform: 'none',
                  fontWeight: 500,
                }}
              >
                Contacto
              </Button>

              <Button
                variant="contained"
                onClick={handleLogin}
                sx={{
                  ml: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2.5,
                  backgroundColor: '#0f766e',
                  '&:hover': {
                    backgroundColor: '#115e59',
                  },
                }}
              >
                Iniciar sesión
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* HERO */}
      <Box
        sx={{
          backgroundColor: '#ecfdf5',
          py: 10,
        }}
      >
        <Container maxWidth="lg">
          <Grid
          container
          spacing={6}
          sx={{
          alignItems: 'center',
        }}
>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="overline"
                sx={{
                  color: '#0f766e',
                  fontWeight: 700,
                  letterSpacing: 1.5,
                }}
              >
                CLÍNICA MÁS DENT
              </Typography>

              <Typography
                variant="h2"
                sx={{
                  mt: 1,
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.1,
                  fontSize: {
                    xs: '2.5rem',
                    md: '4rem',
                  },
                }}
              >
                Tu salud dental,
                <Box
                  component="span"
                  sx={{
                    display: 'block',
                    color: '#0f766e',
                  }}
                >
                  más simple y conectada.
                </Box>
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  mt: 3,
                  color: '#475569',
                  fontWeight: 400,
                  lineHeight: 1.7,
                  maxWidth: 650,
                }}
              >
                DentalSys facilita la gestión de tus atenciones
                odontológicas, permitiéndote acceder a tu información
                y gestionar tus horas de manera simple y segura.
              </Typography>

              <Box
                sx={{
                  mt: 4,
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleLogin}
                  endIcon={<ArrowForwardOutlinedIcon />}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                    py: 1.4,
                    fontWeight: 700,
                    backgroundColor: '#0f766e',
                    '&:hover': {
                      backgroundColor: '#115e59',
                    },
                  }}
                >
                  Reservar una hora
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                    py: 1.4,
                    fontWeight: 600,
                    color: '#0f766e',
                    borderColor: '#0f766e',
                  }}
                >
                  Conocer DentalSys
                </Button>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid #d1fae5',
                  backgroundColor: '#ffffff',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      backgroundColor: '#ccfbf1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                    }}
                  >
                    <HealthAndSafetyOutlinedIcon
                      sx={{
                        fontSize: 34,
                        color: '#0f766e',
                      }}
                    />
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    Atención dental organizada
                  </Typography>

                  <Typography
                    sx={{
                      mt: 2,
                      color: '#64748b',
                      lineHeight: 1.7,
                    }}
                  >
                    Una plataforma diseñada para facilitar la
                    administración de la clínica y mejorar la
                    experiencia de sus pacientes.
                  </Typography>

                  <Divider sx={{ my: 3 }} />

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <AccessTimeOutlinedIcon
                      sx={{
                        color: '#0f766e',
                      }}
                    />

                    <Typography
                      sx={{
                        color: '#475569',
                      }}
                    >
                      Información disponible de forma rápida y segura
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* SERVICIOS */}
      <Box
        sx={{
          py: 10,
          backgroundColor: '#ffffff',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              textAlign: 'center',
              mb: 6,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: '#0f766e',
                fontWeight: 700,
                letterSpacing: 1.5,
              }}
            >
              NUESTROS SERVICIOS
            </Typography>

            <Typography
              variant="h3"
              sx={{
                mt: 1,
                fontWeight: 800,
                color: '#0f172a',
                fontSize: {
                  xs: '2rem',
                  md: '2.8rem',
                },
              }}
            >
              Atención pensada para ti
            </Typography>

            <Typography
              sx={{
                mt: 2,
                color: '#64748b',
                maxWidth: 650,
                mx: 'auto',
              }}
            >
              Accede a una gestión odontológica más ordenada,
              sencilla y transparente.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <ServiceCard
                icon={<HealthAndSafetyOutlinedIcon />}
                title="Evaluación dental"
                description="Evaluaciones odontológicas para conocer tu estado de salud bucal."
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <ServiceCard
                icon={<CleaningServicesOutlinedIcon />}
                title="Limpieza dental"
                description="Mantén una adecuada higiene y prevención de enfermedades dentales."
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <ServiceCard
                icon={<MedicalServicesOutlinedIcon />}
                title="Tratamientos"
                description="Consulta y gestiona información relacionada con tus tratamientos."
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* DENTALSYS */}
      <Box
        sx={{
          py: 10,
          backgroundColor: '#f8fafc',
        }}
      >
        <Container maxWidth="lg">
          <Grid
          container
          spacing={6}
         sx={{
            alignItems: 'center',
     }}
    >
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="overline"
                sx={{
                  color: '#0f766e',
                  fontWeight: 700,
                  letterSpacing: 1.5,
                }}
              >
                DENTALSYS
              </Typography>

              <Typography
                variant="h3"
                sx={{
                  mt: 1,
                  fontWeight: 800,
                  color: '#0f172a',
                  fontSize: {
                    xs: '2rem',
                    md: '2.8rem',
                  },
                }}
              >
                Tecnología al servicio de la salud dental
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  color: '#64748b',
                  lineHeight: 1.8,
                }}
              >
                DentalSys permite centralizar la información
                odontológica y facilitar la gestión de pacientes,
                horas, fichas clínicas y presupuestos.
              </Typography>

              <Box sx={{ mt: 4 }}>
                <FeatureRow
                  icon={<CalendarMonthOutlinedIcon />}
                  title="Reserva de horas"
                  description="Gestiona tus próximas atenciones."
                />

                <FeatureRow
                  icon={<PeopleOutlinedIcon />}
                  title="Información centralizada"
                  description="La información del paciente organizada en un solo lugar."
                />

                <FeatureRow
                  icon={<DescriptionOutlinedIcon />}
                  title="Consulta de presupuestos"
                  description="Visualiza información de tus presupuestos odontológicos."
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  backgroundColor: '#0f766e',
                  color: '#ffffff',
                }}
              >
                <CardContent sx={{ p: 5 }}>
                  <MedicalServicesOutlinedIcon
                    sx={{
                      fontSize: 48,
                      mb: 3,
                    }}
                  />

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                    }}
                  >
                    Gestión odontológica
                  </Typography>

                  <Typography
                    sx={{
                      mt: 2,
                      lineHeight: 1.8,
                      opacity: 0.9,
                    }}
                  >
                    Una solución digital orientada a mejorar la
                    organización de la clínica y la experiencia
                    de sus pacientes.
                  </Typography>

                  <Box
                    sx={{
                      mt: 4,
                      display: 'flex',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <StatCard
                      value="2"
                      label="Sucursales"
                    />

                    <StatCard
                      value="24/7"
                      label="Acceso digital"
                    />

                    <StatCard
                      value="100%"
                      label="Gestión digital"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CLÍNICA */}
      <Box
        sx={{
          py: 10,
          backgroundColor: '#ffffff',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              textAlign: 'center',
              mb: 6,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: '#0f766e',
                fontWeight: 700,
                letterSpacing: 1.5,
              }}
            >
              CLÍNICA MÁS DENT
            </Typography>

            <Typography
              variant="h3"
              sx={{
                mt: 1,
                fontWeight: 800,
                color: '#0f172a',
                fontSize: {
                  xs: '2rem',
                  md: '2.8rem',
                },
              }}
            >
              Una atención más cercana
            </Typography>

            <Typography
              sx={{
                mt: 2,
                color: '#64748b',
                maxWidth: 700,
                mx: 'auto',
                lineHeight: 1.7,
              }}
            >
              Clínica Más Dent busca entregar una atención
              odontológica organizada, cercana y apoyada por
              herramientas digitales.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard
                icon={<PeopleOutlinedIcon />}
                title="2 sucursales"
                description="Atención disponible en diferentes puntos de la clínica."
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard
                icon={<AccessTimeOutlinedIcon />}
                title="Atención organizada"
                description="Una gestión que facilita la coordinación de las atenciones."
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard
                icon={<HealthAndSafetyOutlinedIcon />}
                title="Atención segura"
                description="Información organizada para una mejor experiencia."
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box
        sx={{
          py: 10,
          backgroundColor: '#ecfdf5',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#0f172a',
                fontSize: {
                  xs: '2rem',
                  md: '3rem',
                },
              }}
            >
              Tu próxima atención comienza aquí
            </Typography>

            <Typography
              sx={{
                mt: 2,
                color: '#64748b',
                lineHeight: 1.7,
              }}
            >
              Ingresa a DentalSys para acceder a la gestión de
              tus atenciones odontológicas.
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              endIcon={<ArrowForwardOutlinedIcon />}
              sx={{
                mt: 4,
                textTransform: 'none',
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                backgroundColor: '#0f766e',
                '&:hover': {
                  backgroundColor: '#115e59',
                },
              }}
            >
              Iniciar sesión
            </Button>
          </Box>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box
        component="footer"
        sx={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          py: 5,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: '#0f766e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MedicalServicesOutlinedIcon />
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  DentalSys
                </Typography>
              </Box>

              <Typography
                sx={{
                  mt: 2,
                  color: '#94a3b8',
                  maxWidth: 500,
                  lineHeight: 1.7,
                }}
              >
                Sistema web de gestión odontológica para
                Clínica Más Dent.
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                }}
              >
                Accesos
              </Typography>

              <Box
                sx={{
                  mt: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <Button
                  onClick={handleLogin}
                  sx={{
                    justifyContent: 'flex-start',
                    color: '#cbd5e1',
                    textTransform: 'none',
                    px: 0,
                  }}
                >
                  Iniciar sesión
                </Button>

                <Button
                  sx={{
                    justifyContent: 'flex-start',
                    color: '#cbd5e1',
                    textTransform: 'none',
                    px: 0,
                  }}
                >
                  Servicios
                </Button>

                <Button
                  sx={{
                    justifyContent: 'flex-start',
                    color: '#cbd5e1',
                    textTransform: 'none',
                    px: 0,
                  }}
                >
                  Contacto
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider
            sx={{
              my: 4,
              borderColor: '#334155',
            }}
          />

          <Typography
            variant="body2"
            sx={{
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            © {new Date().getFullYear()} DentalSys · Clínica Más Dent
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}

/* =========================
   COMPONENTES AUXILIARES
========================= */

type ServiceCardProps = {
  icon: React.ReactNode
  title: string
  description: string
}

function ServiceCard({
  icon,
  title,
  description,
}: ServiceCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid #e2e8f0',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            backgroundColor: '#ccfbf1',
            color: '#0f766e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          {icon}
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 1.5,
            color: '#64748b',
            lineHeight: 1.7,
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  )
}

type FeatureRowProps = {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureRow({
  icon,
  title,
  description,
}: FeatureRowProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        mb: 3,
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          minWidth: 46,
          borderRadius: 2,
          backgroundColor: '#ccfbf1',
          color: '#0f766e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          sx={{
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: '#64748b',
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  )
}

type StatCardProps = {
  value: string
  label: string
}

function StatCard({
  value,
  label,
}: StatCardProps) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 100,
        p: 2,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
        }}
      >
        {value}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          mt: 0.5,
          opacity: 0.85,
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

type InfoCardProps = {
  icon: React.ReactNode
  title: string
  description: string
}

function InfoCard({
  icon,
  title,
  description,
}: InfoCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid #e2e8f0',
      }}
    >
      <CardContent
        sx={{
          p: 4,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: '#ccfbf1',
            color: '#0f766e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          {icon}
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: '#64748b',
            lineHeight: 1.7,
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default Home
