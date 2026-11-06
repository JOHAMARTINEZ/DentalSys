import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'

import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'

const API_URL = 'http://localhost:8080'

interface LoginForm {
  identifier: string
  password: string
}

interface LoginResponse {
  token: string
  username?: string
  rol?: string
  idUsuario?: number
  correo?: string
  rut?: string
  nombres?: string
  apellidos?: string
}

interface AuthBenefitProps {
  icon: React.ReactNode
  title: string
  description: string
}

function AuthBenefit({
  icon,
  title,
  description,
}: AuthBenefitProps) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          backgroundColor: '#eaf4ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: '#263238',
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          {description}
        </Typography>
      </Box>
    </Stack>
  )
}

function Login() {
  const navigate = useNavigate()

  // Usuario recordado:
  // se carga directamente dentro del estado inicial.
  const rememberedUser =
    localStorage.getItem('dentalsys_remembered_user') || ''

  const [formData, setFormData] = useState<LoginForm>({
    identifier: rememberedUser,
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [rememberUser, setRememberUser] = useState(
    Boolean(rememberedUser)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!formData.identifier.trim()) {
      setError('Ingresa tu RUT, correo o usuario.')
      return
    }

    if (!formData.password) {
      setError('Ingresa tu contraseña.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            identificador: formData.identifier.trim(),
            password: formData.password,
          }),
        }
      )

      let data: LoginResponse | null = null

      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            'Las credenciales ingresadas no son válidas.'
          )
        }

        if (response.status === 403) {
          throw new Error(
            'No tienes autorización para acceder al sistema.'
          )
        }

        throw new Error(
          'No fue posible iniciar sesión.'
        )
      }

      if (!data?.token) {
        throw new Error(
          'El servidor no entregó un token de autenticación.'
        )
      }

      localStorage.setItem(
        'dentalsys_token',
        data.token
      )

      localStorage.setItem(
        'dentalsys_username',
        data.username ||
          data.correo ||
          formData.identifier.trim()
      )

      if (data.rol) {
        localStorage.setItem(
          'dentalsys_rol',
          data.rol
        )
      }

      localStorage.setItem(
        'dentalsys_usuario',
        JSON.stringify({
          idUsuario: data.idUsuario,
          username: data.username,
          correo: data.correo,
          rut: data.rut,
          nombres: data.nombres,
          apellidos: data.apellidos,
          rol: data.rol,
        })
      )

      if (rememberUser) {
        localStorage.setItem(
          'dentalsys_remembered_user',
          formData.identifier.trim()
        )
      } else {
        localStorage.removeItem(
          'dentalsys_remembered_user'
        )
      }

      if (data.rol === 'PACIENTE') {
        navigate('/portal', {
          replace: true,
        })
      } else {
        navigate('/gestion/inicio', {
          replace: true,
        })
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No fue posible iniciar sesión.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #eef7ff 0%, #f8fbff 50%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: {
          xs: 2,
          md: 4,
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 1080,
          overflow: 'hidden',
          borderRadius: 4,
          border: '1px solid #e2eaf2',
          boxShadow:
            '0 20px 60px rgba(33, 150, 243, 0.10)',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '0.95fr 1.05fr',
            },
          }}
        >
          {/* =========================
              PANEL INFORMATIVO
          ========================= */}
          <Box
            sx={{
              background:
                'linear-gradient(145deg, #0d47a1 0%, #1976d2 55%, #42a5f5 100%)',
              color: '#ffffff',
              p: {
                xs: 4,
                md: 6,
              },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Stack
              spacing={3}
              sx={{
                maxWidth: 440,
                mx: 'auto',
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  backgroundColor:
                    'rgba(255,255,255,0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MedicalServicesOutlinedIcon
                  sx={{
                    fontSize: 36,
                    color: '#ffffff',
                  }}
                />
              </Box>

              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontSize: {
                      xs: '2rem',
                      md: '2.5rem',
                    },
                    mb: 1.5,
                  }}
                >
                  DentalSys
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    lineHeight: 1.5,
                    opacity: 0.95,
                  }}
                >
                  Sistema de gestión odontológica
                </Typography>
              </Box>

              <Typography
                variant="body1"
                sx={{
                  lineHeight: 1.7,
                  opacity: 0.9,
                }}
              >
                Gestiona tus atenciones odontológicas de
                manera simple, segura y organizada.
              </Typography>

              <Stack spacing={2.5}>
                <AuthBenefit
                  icon={
                    <SecurityOutlinedIcon
                      sx={{ color: '#1976d2' }}
                    />
                  }
                  title="Acceso seguro"
                  description="Protección de tus datos y credenciales."
                />

                <AuthBenefit
                  icon={
                    <EventAvailableOutlinedIcon
                      sx={{ color: '#1976d2' }}
                    />
                  }
                  title="Gestión de citas"
                  description="Consulta y administra tus horas."
                />

                <AuthBenefit
                  icon={
                    <PersonOutlineOutlinedIcon
                      sx={{ color: '#1976d2' }}
                    />
                  }
                  title="Atención personalizada"
                  description="Información centralizada en un solo lugar."
                />
              </Stack>
            </Stack>
          </Box>

          {/* =========================
              FORMULARIO
          ========================= */}
          <Box
            sx={{
              p: {
                xs: 3,
                sm: 5,
                md: 6,
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 430,
              }}
            >
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: '#263238',
                    mb: 1,
                  }}
                >
                  Iniciar sesión
                </Typography>

                <Typography
                  variant="body1"
                  color="text.secondary"
                >
                  Ingresa tus credenciales para acceder a
                  DentalSys.
                </Typography>
              </Box>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
              >
                <Stack spacing={2.5}>
                  {/* IDENTIFICADOR */}
                  <TextField
                    fullWidth
                    label="RUT, correo o usuario"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleChange}
                    autoComplete="username"
                    disabled={loading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineOutlinedIcon
                              sx={{
                                color: '#78909c',
                              }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  {/* CONTRASEÑA */}
                  <TextField
                    fullWidth
                    label="Contraseña"
                    name="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    disabled={loading}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon
                              sx={{
                                color: '#78909c',
                              }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() =>
                                setShowPassword(
                                  (previous) =>
                                    !previous
                                )
                              }
                              edge="end"
                              disabled={loading}
                              aria-label={
                                showPassword
                                  ? 'Ocultar contraseña'
                                  : 'Mostrar contraseña'
                              }
                            >
                              {showPassword ? (
                                <VisibilityOffOutlinedIcon />
                              ) : (
                                <VisibilityOutlinedIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  {/* RECORDAR USUARIO */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberUser}
                        onChange={(event) =>
                          setRememberUser(
                            event.target.checked
                          )
                        }
                        disabled={loading}
                      />
                    }
                    label="Recordar usuario"
                  />

                  {/* BOTÓN */}
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                    startIcon={
                      loading ? (
                        <CircularProgress
                          size={20}
                          color="inherit"
                        />
                      ) : (
                        <LockOutlinedIcon />
                      )
                    }
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 700,
                      boxShadow:
                        '0 8px 20px rgba(25, 118, 210, 0.22)',
                    }}
                  >
                    {loading
                      ? 'Ingresando...'
                      : 'Iniciar sesión'}
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Stack
                direction="row"
                spacing={1.9}
                sx={{
                  alignItems: 'flex-start',
                }}
              >
                <SecurityOutlinedIcon
                  sx={{
                    color: '#1976d2',
                    mt: 0.2,
                  }}
                />

                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: '#263238',
                      mb: 0.5,
                    }}
                  >
                    Acceso protegido
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.5,
                      display: 'block',
                    }}
                  >
                    Tus credenciales son utilizadas
                    únicamente para autenticarte en el
                    sistema.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

export default Login
