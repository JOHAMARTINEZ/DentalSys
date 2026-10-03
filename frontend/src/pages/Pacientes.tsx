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
import { apiGet, apiPost } from '../services/api'

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

  const [openDialog, setOpenDialog] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState('')

  const [formulario, setFormulario] =
    useState<NuevoPaciente>(formularioInicial)

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
    setFormulario(formularioInicial)
    setErrorFormulario('')
    setOpenDialog(true)
  }

  const cerrarFormulario = () => {
    if (!guardando) {
      setOpenDialog(false)
      setErrorFormulario('')
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
      !formulario.rut ||
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

      setOpenDialog(false)
      setFormulario(formularioInicial)

      await cargarPacientes()
    } catch {
      setErrorFormulario(
        'No fue posible registrar el paciente. Verifica que el RUT no esté registrado.',
      )
    } finally {
      setGuardando(false)
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
        ) : pacientes.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No hay pacientes registrados.
            </Typography>
          </Box>
        ) : (
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
              </TableRow>
            </TableHead>

            <TableBody>
              {pacientes.map((paciente) => (
                <TableRow
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
            Registrar nuevo paciente
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
                : 'Guardar paciente'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default Pacientes