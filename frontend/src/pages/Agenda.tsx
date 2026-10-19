import { useEffect, useState } from 'react'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import { apiGet } from '../services/api'

interface Cita {
  idCita: number
  fechaHora: string
  motivo: string | null
  estado: string

  paciente: {
    idPaciente: number
    nombres: string
    apellidos: string
  }

  odontologo: {
    idUsuario: number
    especialidad: string
    numeroRegistroSalud: string
  }

  sucursal: {
    idSucursal: number
    nombre: string
    direccion: string
    telefono: string | null
    estado: boolean
  }
}

interface Paciente {
  idPaciente: number
  nombres: string
  apellidos: string
  estado: number
}

function Agenda() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [abrirNuevaCita, setAbrirNuevaCita] = useState(false)

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<number | ''>('')

  useEffect(() => {
    const cargarCitas = async () => {
      try {
        const data = await apiGet<Cita[]>('/api/citas')
        setCitas(data)
      } catch (err) {
        console.error(err)
        setError('No fue posible cargar las citas.')
      } finally {
        setCargando(false)
      }
    }

    cargarCitas()
  }, [])

  useEffect(() => {
    const cargarPacientes = async () => {
      try {
        const data = await apiGet<Paciente[]>('/api/pacientes')
        setPacientes(data)
      } catch (err) {
        console.error(err)
      }
    }

    cargarPacientes()
  }, [])

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Agenda
      </Typography>

      <Typography variant="body1" sx={{ mb: 3 }}>
        Gestión de citas odontológicas
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 3,
        }}
      >
        <Button
          variant="contained"
          onClick={() => setAbrirNuevaCita(true)}
        >
          Nueva cita
        </Button>
      </Box>

      {cargando && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Dialog
        open={abrirNuevaCita}
        onClose={() => setAbrirNuevaCita(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Nueva cita</DialogTitle>

       <DialogContent>
  <Typography variant="body2" sx={{ mb: 1, mt: 1 }}>
    Fecha y hora
  </Typography>

  <TextField
    type="datetime-local"
    fullWidth
    margin="normal"
  />

  <FormControl fullWidth margin="normal">
    <InputLabel>Paciente</InputLabel>

    <Select
      value={pacienteSeleccionado}
      label="Paciente"
      onChange={(event) =>
        setPacienteSeleccionado(event.target.value as number)
      }
    >
      {pacientes.map((paciente) => (
        <MenuItem
          key={paciente.idPaciente}
          value={paciente.idPaciente}
        >
          {paciente.nombres} {paciente.apellidos}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</DialogContent>
      </Dialog>

      {!cargando && !error && citas.length === 0 && (
        <Alert severity="info">
          No existen citas registradas actualmente.
        </Alert>
      )}

      {!cargando && !error && citas.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Fecha y hora</TableCell>
                <TableCell>Paciente</TableCell>
                <TableCell>Odontólogo</TableCell>
                <TableCell>Sucursal</TableCell>
                <TableCell>Motivo</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {citas.map((cita) => (
                <TableRow key={cita.idCita}>
                  <TableCell>{cita.idCita}</TableCell>

                  <TableCell>
                    {cita.fechaHora}
                  </TableCell>

                  <TableCell>
                    {cita.paciente.nombres}{' '}
                    {cita.paciente.apellidos}
                  </TableCell>

                  <TableCell>
                    {cita.odontologo.especialidad}
                  </TableCell>

                  <TableCell>
                    {cita.sucursal.nombre}
                  </TableCell>

                  <TableCell>
                    {cita.motivo || '-'}
                  </TableCell>

                  <TableCell>
                    {cita.estado}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}

export default Agenda