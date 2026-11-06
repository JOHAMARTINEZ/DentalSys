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

import { apiGet, apiPost } from '../services/api'


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
interface Odontologo {
  idUsuario: number
  nombres: string
  apellidos: string
  especialidad: string
}
interface Sucursal {
  idSucursal: number
  nombre: string
  direccion: string
  telefono: string | null
  estado: boolean
}
function Agenda() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [fechaHora, setFechaHora] = useState('')

  const [abrirNuevaCita, setAbrirNuevaCita] = useState(false)

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<number | ''>('')
  const [odontologos, setOdontologos] = useState<Odontologo[]>([])
  const [odontologoSeleccionado, setOdontologoSeleccionado] =
  useState<number | ''>('')
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [sucursalSeleccionada, setSucursalSeleccionada] =
  useState<number | ''>('')
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('')
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
    useEffect(() => {
  const cargarOdontologos = async () => {
    try {
  const data = await apiGet<Odontologo[]>('/api/odontologos')
      setOdontologos(data)
    } catch (err) {
      console.error(err)
    }
  }

  cargarOdontologos()
  }, [])
  useEffect(() => {
  const cargarSucursales = async () => {
    try {
      const data = await apiGet<Sucursal[]>('/api/sucursales')
      setSucursales(data)
    } catch (err) {
      console.error(err)
    }
  }

  cargarSucursales()
  }, [])
   
   const crearCita = async () => {
  if (
    !fechaHora ||
    pacienteSeleccionado === '' ||
    odontologoSeleccionado === '' ||
    sucursalSeleccionada === '' ||
    !motivoSeleccionado
  ) {
    setError('Debe completar todos los campos de la cita.')
    return
  }

  try {
    const nuevaCita = await apiPost<Cita>('/api/citas', {
      fechaHora,
      motivo: motivoSeleccionado,
      paciente: {
        idPaciente: pacienteSeleccionado,
      },
      odontologo: {
        idUsuario: odontologoSeleccionado,
      },
      sucursal: {
        idSucursal: sucursalSeleccionada,
      },
    })

    setCitas((citasActuales) => [...citasActuales, nuevaCita])

    setAbrirNuevaCita(false)

    setFechaHora('')
    setPacienteSeleccionado('')
    setOdontologoSeleccionado('')
    setSucursalSeleccionada('')
    setMotivoSeleccionado('')

    setError('')
  } catch (err) {
    console.error(err)
    setError('No fue posible registrar la cita.')
  }
}

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
     required
     value={fechaHora}
     onChange={(event) => setFechaHora(event.target.value)}
   />

  <FormControl fullWidth margin="normal">
  <InputLabel required>Paciente</InputLabel>

    <Select
  value={pacienteSeleccionado}
  label="Paciente"
  required
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

  <FormControl fullWidth margin="normal">
<InputLabel required>Odontólogo</InputLabel>
  <Select
    value={odontologoSeleccionado}
    label="Odontólogo"
    required
    onChange={(event) =>
      setOdontologoSeleccionado(event.target.value as number)
    }
  >
    {odontologos.map((odontologo) => (
      <MenuItem
        key={odontologo.idUsuario}
        value={odontologo.idUsuario}
      >
        {odontologo.nombres} {odontologo.apellidos} - {odontologo.especialidad}
      </MenuItem>
    ))}
  </Select>
</FormControl>
  <FormControl fullWidth margin="normal">
  <InputLabel required>Sucursal</InputLabel>
  <Select
    value={sucursalSeleccionada}
    label="Sucursal"
    required
    onChange={(event) =>
      setSucursalSeleccionada(event.target.value as number)
    }
  >
    {sucursales.map((sucursal) => (
      <MenuItem
        key={sucursal.idSucursal}
        value={sucursal.idSucursal}
      >
        {sucursal.nombre}
      </MenuItem>
    ))}
  </Select>
  </FormControl>
   <FormControl fullWidth margin="normal">
   <InputLabel required>Motivo</InputLabel>
  <Select
    value={motivoSeleccionado}
    label="Motivo"
    required
    onChange={(event) =>
      setMotivoSeleccionado(event.target.value)
    }
  >
    <MenuItem value="Evaluación dental">
      Evaluación dental
    </MenuItem>

    <MenuItem value="Presupuesto">
      Presupuesto
    </MenuItem>

    <MenuItem value="Control">
      Control
    </MenuItem>

    <MenuItem value="Limpieza dental">
      Limpieza dental
    </MenuItem>

    <MenuItem value="Extracción dental">
      Extracción dental
    </MenuItem>

    <MenuItem value="Dolor o urgencia dental">
      Dolor o urgencia dental
    </MenuItem>

    <MenuItem value="Restauración dental">
      Restauración dental
    </MenuItem>

    <MenuItem value="Tratamiento de conducto">
      Tratamiento de conducto
    </MenuItem>

    <MenuItem value="Otro">
      Otro
    </MenuItem>
  </Select>
</FormControl>
     <Box
  sx={{
    display: 'flex',
    justifyContent: 'flex-end',
    mt: 2,
  }}
>
  <Button
    variant="contained"
    onClick={crearCita}
  >
    Guardar cita
  </Button>
</Box>
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