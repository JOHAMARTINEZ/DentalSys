import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import BlockIcon from '@mui/icons-material/Block'

import { apiGet, apiPost, apiPut } from '../services/api'

type Paciente = {
  idPaciente: number
  rut: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  telefono?: string
  correo?: string
  direccion?: string
  estado: number
}

type NuevoPaciente = {
  rut: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  telefono: string
  correo: string
  direccion: string
}

const formularioInicial: NuevoPaciente = {
  rut: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  telefono: '',
  correo: '',
  direccion: '',
}

function Pacientes() {
const [pacientes, setPacientes] = useState<Paciente[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
const [busqueda, setBusqueda] = useState('')

const [openDialog, setOpenDialog] = useState(false)
const [guardando, setGuardando] = useState(false)
const [errorFormulario, setErrorFormulario] = useState('')

const [formulario, setFormulario] =
    useState<NuevoPaciente>(formularioInicial)
const [pacienteEditando, setPacienteEditando] =
    useState<Paciente | null>(null)
const pacientesFiltrados = pacientes.filter((paciente) => {
const texto = busqueda.toLowerCase().trim()

  if (!texto) {
    return true
  }

  return (
    paciente.rut.toLowerCase().includes(texto) ||
    paciente.nombres.toLowerCase().includes(texto) ||
    paciente.apellidos.toLowerCase().includes(texto)
  )
})


  useEffect(() => {
    cargarPacientes()
  }, [])

  const cargarPacientes = async () => {
    try {
      setLoading(true)
      setError('')

  const data = await apiGet<Paciente[]>('/api/pacientes')
      setPacientes(data)
    } catch {
      setError('No fue posible cargar los pacientes.')
    } finally {
      setLoading(false)
    }
  }

  const abrirFormulario = () => {
      setPacienteEditando(null)
      setFormulario(formularioInicial)
      setErrorFormulario('')
      setOpenDialog(true)
  }

  const abrirEdicion = (paciente: Paciente) => {
  setPacienteEditando(paciente)

  setFormulario({
    rut: paciente.rut,
    nombres: paciente.nombres,
    apellidos: paciente.apellidos,
    fechaNacimiento: paciente.fechaNacimiento,
    telefono: paciente.telefono || '',
    correo: paciente.correo || '',
    direccion: paciente.direccion || '',
  })
 
  setErrorFormulario('')
  setOpenDialog(true)
}
  const cerrarFormulario = () => {
    if (!guardando) {
    setOpenDialog(false)
    setErrorFormulario('')
    setPacienteEditando(null)
  }
}

  const manejarCambio = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
  const { name, value } = event.target

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  const registrarPaciente = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault()

  setErrorFormulario('')

  if (
    !formulario.nombres ||
    !formulario.apellidos ||
    !formulario.fechaNacimiento
  ) {
    setErrorFormulario(
      'Completa los campos obligatorios.',
    )
    return
  }

  try {
    setGuardando(true)

    if (pacienteEditando) {
      await apiPut<Paciente>(
        `/api/pacientes/${pacienteEditando.idPaciente}`,
        {
          nombres: formulario.nombres,
          apellidos: formulario.apellidos,
          fechaNacimiento: formulario.fechaNacimiento,
          telefono: formulario.telefono || null,
          correo: formulario.correo || null,
          direccion: formulario.direccion || null,
        },
      )
    } else {
      if (!formulario.rut) {
        setErrorFormulario(
          'El RUT es obligatorio.',
        )
        return
      }

      await apiPost<Paciente>('/api/pacientes', {
        rut: formulario.rut,
        nombres: formulario.nombres,
        apellidos: formulario.apellidos,
        fechaNacimiento: formulario.fechaNacimiento,
        telefono: formulario.telefono || null,
        correo: formulario.correo || null,
        direccion: formulario.direccion || null,
        estado: 1,
      })
    }

    setOpenDialog(false)
    setFormulario(formularioInicial)
    setPacienteEditando(null)

    await cargarPacientes()
  } catch {
    setErrorFormulario(
      pacienteEditando
        ? 'No fue posible actualizar el paciente.'
        : 'No fue posible registrar el paciente. Verifica que el RUT no esté registrado.',
    )
  } finally {
    setGuardando(false)
  }
}

const desactivarPaciente = async (paciente: Paciente) => {
  const confirmar = window.confirm(
    `¿Está seguro de que desea desactivar al paciente ${paciente.nombres} ${paciente.apellidos}?`,
  )

  if (!confirmar) {
    return
  }

  try {
    setError('')

    await apiPut<Paciente>(
      `/api/pacientes/${paciente.idPaciente}/desactivar`,
      {},
    )

    await cargarPacientes()
  } catch {
    setError('No fue posible desactivar el paciente.')
  }
}

const activarPaciente = async (paciente: Paciente) => {
  const confirmar = window.confirm(
    `¿Está seguro de que desea activar al paciente ${paciente.nombres} ${paciente.apellidos}?`,
  )

  if (!confirmar) return

  try {
    setError('')

    await apiPut<Paciente>(
      `/api/pacientes/${paciente.idPaciente}/activar`,
      {},
    )

    await cargarPacientes()
  } catch {
    setError('No fue posible activar el paciente.')
  }
}


  return (
    <Box>
      {/* Encabezado */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Gestión de Pacientes
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Administra los pacientes registrados en DentalSys
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={abrirFormulario}
        >
          Nuevo paciente
        </Button>
      </Box>

      {/* Error de carga */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Búsqueda */}
      <Box sx={{ mb: 2 }}>
      <TextField
       fullWidth
        label="Buscar paciente"
        placeholder="Buscar por nombre, apellido o RUT"
        value={busqueda}
        onChange={(event) => setBusqueda(event.target.value)}
      />
    </Box>




      {/* Tabla */}
      <TableContainer component={Paper} elevation={2}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 250,
            }}
          >
            <CircularProgress />
          </Box>
        ) : pacientesFiltrados.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
          {busqueda
          ? 'No se encontraron pacientes.'
          : 'No hay pacientes registrados.'}
         </Typography>
         </Box>
        )
       : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>RUT</strong>
                </TableCell>

                <TableCell>
                  <strong>Nombre</strong>
                </TableCell>

                <TableCell>
                  <strong>Fecha nacimiento</strong>
                </TableCell>

                <TableCell>
                  <strong>Teléfono</strong>
                </TableCell>

                <TableCell>
                  <strong>Correo</strong>
                </TableCell>

                <TableCell>
                  <strong>Estado</strong>
                </TableCell>

                <TableCell>
                <strong>Acciones</strong>
                </TableCell>


              </TableRow>
            </TableHead>

            <TableBody>
                  {pacientesFiltrados.map((paciente) => (                <TableRow
                  key={paciente.idPaciente}
                  hover
                >
                  <TableCell>
                    {paciente.rut}
                  </TableCell>

                  <TableCell>
                    {paciente.nombres} {paciente.apellidos}
                  </TableCell>

                  <TableCell>
                    {paciente.fechaNacimiento}
                  </TableCell>

                  <TableCell>
                    {paciente.telefono || '-'}
                  </TableCell>

                  <TableCell>
                    {paciente.correo || '-'}
                  </TableCell>

                  <TableCell>
                    {paciente.estado === 1
                      ? 'Activo'
                      : 'Inactivo'}
                  </TableCell>
                  <TableCell>
                  <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => abrirEdicion(paciente)}
                  >
                  Editar
                  </Button>

                  {paciente.estado === 1 ? (
                  <Button
                  size="small"
                  startIcon={<BlockIcon />}
                  onClick={() => desactivarPaciente(paciente)}
                  >
                  Desactivar
                  </Button>
                  ) : (
                <Button
                size="small"
                startIcon={<BlockIcon />}
                onClick={() => activarPaciente(paciente)}
                >
                Activar
                </Button>
                 )}
                </TableCell>

                  
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Formulario nuevo paciente */}
      <Dialog
        open={openDialog}
        onClose={cerrarFormulario}
        fullWidth
        maxWidth="sm"
      >
        <Box
          component="form"
          onSubmit={registrarPaciente}
        >
        <DialogTitle>
         {pacienteEditando
         ? 'Editar paciente'
         : 'Registrar nuevo paciente'}
         </DialogTitle>

          <DialogContent>
            {errorFormulario && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorFormulario}
              </Alert>
            )}

            <TextField
              fullWidth
              required
              label="RUT"
              name="rut"
              value={formulario.rut}
              onChange={manejarCambio}
              margin="normal"
              placeholder="12.345.678-9"
              disabled={Boolean(pacienteEditando)}
            />

            <TextField
              fullWidth
              required
              label="Nombres"
              name="nombres"
              value={formulario.nombres}
              onChange={manejarCambio}
              margin="normal"
            />

            <TextField
              fullWidth
              required
              label="Apellidos"
              name="apellidos"
              value={formulario.apellidos}
              onChange={manejarCambio}
              margin="normal"
            />

            <TextField
              fullWidth
              required
              label="Fecha de nacimiento"
              name="fechaNacimiento"
              type="date"
              value={formulario.fechaNacimiento}
              onChange={manejarCambio}
              margin="normal"
              slotProps={{
              inputLabel: {
              shrink: true,
              },
             }}
            />

            <TextField
              fullWidth
              label="Teléfono"
              name="telefono"
              value={formulario.telefono}
              onChange={manejarCambio}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Correo electrónico"
              name="correo"
              type="email"
              value={formulario.correo}
              onChange={manejarCambio}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Dirección"
              name="direccion"
              value={formulario.direccion}
              onChange={manejarCambio}
              margin="normal"
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={cerrarFormulario}
              disabled={guardando}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={guardando}
            >
              {guardando
              ? 'Guardando...'
              : pacienteEditando
              ? 'Actualizar paciente'
              : 'Guardar paciente'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default Pacientes