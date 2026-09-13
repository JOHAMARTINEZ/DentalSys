import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../services/api'

type LoginResponse = {
  token: string
  username: string
}

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault()
  setError('')

  if (!username || !password) {
    setError('Ingresa tu usuario y contraseña.')
    return
  }

  try {
    const response = await apiPost<LoginResponse>('/api/auth/login', {
      username,
      password,
    })

    localStorage.setItem('dentalsys_token', response.token)
    localStorage.setItem('dentalsys_username', response.username)

    navigate('/inicio')
  } catch {
    setError('Usuario o contraseña incorrectos.')
  }
}

    
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f7fa',
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#e8f0fe',
              mb: 2,
            }}
          >
            <LockOutlinedIcon sx={{ color: '#1976d2' }} />
          </Box>
            <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 600 }}
            >
            DentalSys
            </Typography>
            
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, mb: 3 }}
          >
            Sistema de Gestión Dental
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: '100%' }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              margin="normal"
              autoComplete="username"
            />

            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              margin="normal"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 3,
                py: 1.4,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              Iniciar sesión
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

export default Login