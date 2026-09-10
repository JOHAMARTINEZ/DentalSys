import { useEffect, useState } from 'react'
import Typography from '@mui/material/Typography'
import { apiGet } from '../services/api'

type HealthResponse = {
  status: string
  application: string
}

function Inicio() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<HealthResponse>('/api/health')
      .then(setHealth)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <>
      <Typography variant="h4">
        Inicio
      </Typography>

      {health && (
        <Typography sx={{ mt: 2 }}>
          Backend conectado: {health.application} — estado: {health.status}
        </Typography>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          Error de conexión: {error}
        </Typography>
      )}
    </>
  )
}

export default Inicio
