import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined'
import FamilyRestroomOutlinedIcon from '@mui/icons-material/FamilyRestroomOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'

import { apiGet, apiPost, apiPut, getRol, mensajeError } from '../services/api'

/* =========================================================
   PACIENTES
   - Recepción y administración: registrar, editar, activar/desactivar.
   - Odontólogo: solo consulta.
   - Ficha lateral con datos, apoderado, cuenta del portal e
     historial de citas del paciente.
   Endpoints: /api/pacientes y /api/citas?idPaciente=
========================================================= */

const GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)'

interface Paciente {
  idPaciente: number
  rut: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  edad: number | null
  telefono: string | null
  correo: string | null
  direccion: string | null
  apoderadoNombre: string | null
  apoderadoRut: string | null
  apoderadoTelefono: string | null
  activo: boolean
  tieneCuenta: boolean
  usuarioCuenta: string | null
  totalCitas: number
  proximaCita: string | null
  ultimaCitaCompletada: string | null
}

interface CitaPaciente {
  idCita: number
  fechaHora: string
  estado: string
  tipoAtencion: string | null
  odontologoNombre: string
  sucursalNombre: string
}

interface Formulario {
  rut: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  telefono: string
  correo: string
  direccion: string
  apoderadoNombre: string
  apoderadoRut: string
  apoderadoTelefono: string
}

const VACIO: Formulario = {
  rut: '',
  nombres: '',
  apellidos: '',
  fechaNacimiento: '',
  telefono: '',
  correo: '',
  direccion: '',
  apoderadoNombre: '',
  apoderadoRut: '',
  apoderadoTelefono: '',
}

const ESTADO_CITA: Record<string, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
  RESERVADA: { label: 'Reservada', color: 'warning' },
  CONFIRMADA: { label: 'Confirmada', color: 'primary' },
  COMPLETADA: { label: 'Completada', color: 'success' },
  CANCELADA: { label: 'Cancelada', color: 'default' },
  NO_ASISTIO: { label: 'No asistió', color: 'error' },
}

/* ---------- Utilidades ---------- */

function limpiarRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase()
}

function rutValido(rut: string): boolean {
  const limpio = limpiarRut(rut)
  if (!/^\d{1,8}[0-9K]$/.test(limpio)) return false
  const cuerpo = limpio.slice(0, -1)
  let suma = 0
  let multiplicador = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }
  const resto = 11 - (suma % 11)
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
  return limpio.slice(-1) === esperado
}

function formatearRut(rut: string): string {
  const limpio = limpiarRut(rut)
  if (limpio.length < 2) return rut
  return `${limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${limpio.slice(-1)}`
}

function edadDesde(fecha: string): number | null {
  if (!fecha) return null
  const nacimiento = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(nacimiento.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--
  return edad
}

function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fechaLarga(fecha: string | null): string {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
}

function fechaCorta(fecha: string | null): string {
  if (!fecha) return '—'
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CL')
}

type Errores = Partial<Record<keyof Formulario, string>>

function validar(form: Formulario, creando: boolean): Errores {
  const errores: Errores = {}
  if (creando) {
    if (!form.rut.trim()) errores.rut = 'Ingresa el RUT.'
    else if (!rutValido(form.rut)) errores.rut = 'RUT no válido.'
  }
  if (!form.nombres.trim()) errores.nombres = 'Ingresa los nombres.'
  if (!form.apellidos.trim()) errores.apellidos = 'Ingresa los apellidos.'
  if (!form.fechaNacimiento) errores.fechaNacimiento = 'Ingresa la fecha de nacimiento.'
  else if (form.fechaNacimiento > hoyISO()) errores.fechaNacimiento = 'No puede ser una fecha futura.'
  if (form.correo.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.correo.trim())) errores.correo = 'Correo no válido.'

  const edad = edadDesde(form.fechaNacimiento)
  if (edad !== null && edad < 18 && !form.apoderadoNombre.trim()) {
    errores.apoderadoNombre = 'Obligatorio para menores de edad.'
  }
  if (form.apoderadoRut.trim() && !rutValido(form.apoderadoRut)) errores.apoderadoRut = 'RUT no válido.'
  return errores
}

function Dato({ icono, etiqueta, valor }: { icono: ReactNode; etiqueta: string; valor: ReactNode }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', py: 0.75 }}>
      <Box sx={{ color: 'text.secondary', mt: 0.25 }}>{icono}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">{etiqueta}</Typography>
        <Typography sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{valor || '—'}</Typography>
      </Box>
    </Stack>
  )
}

/* =========================================================
   PÁGINA
========================================================= */

function Pacientes() {
  const navigate = useNavigate()
  const rol = getRol()
  const puedeEditar = rol === 'ADMIN' || rol === 'RECEPCIONISTA'

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('ACTIVOS')
  const [filtroCuenta, setFiltroCuenta] = useState<'TODOS' | 'CON' | 'SIN'>('TODOS')

  // Ficha lateral
  const [detalle, setDetalle] = useState<Paciente | null>(null)
  const [citas, setCitas] = useState<CitaPaciente[]>([])
  const [cargandoCitas, setCargandoCitas] = useState(false)

  // Formulario
  const [dialogo, setDialogo] = useState(false)
  const [editando, setEditando] = useState<Paciente | null>(null)
  const [form, setForm] = useState<Formulario>(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [errorForm, setErrorForm] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [apoderadoManual, setApoderadoManual] = useState(false)

  // Activar / desactivar
  const [cambioEstado, setCambioEstado] = useState<Paciente | null>(null)
  const [errorEstado, setErrorEstado] = useState('')

  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      setPacientes(await apiGet<Paciente[]>('/api/pacientes'))
    } catch (err) {
      setErrorCarga(mensajeError(err, 'No fue posible cargar los pacientes.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const textoRut = limpiarRut(busqueda)
    return pacientes.filter((p) => {
      if (filtroEstado === 'ACTIVOS' && !p.activo) return false
      if (filtroEstado === 'INACTIVOS' && p.activo) return false
      if (filtroCuenta === 'CON' && !p.tieneCuenta) return false
      if (filtroCuenta === 'SIN' && p.tieneCuenta) return false
      if (!texto) return true
      return (
        `${p.nombres} ${p.apellidos}`.toLowerCase().includes(texto) ||
        (textoRut.length > 0 && limpiarRut(p.rut).includes(textoRut)) ||
        (p.correo ?? '').toLowerCase().includes(texto) ||
        (p.telefono ?? '').includes(texto)
      )
    })
  }, [pacientes, busqueda, filtroEstado, filtroCuenta])

  const resumen = useMemo(() => ({
    activos: pacientes.filter((p) => p.activo).length,
    conCuenta: pacientes.filter((p) => p.tieneCuenta).length,
    menores: pacientes.filter((p) => (p.edad ?? 99) < 18).length,
    conProximaCita: pacientes.filter((p) => p.proximaCita).length,
  }), [pacientes])

  /* ---------- Ficha ---------- */

  const abrirDetalle = async (paciente: Paciente) => {
    setDetalle(paciente)
    setCitas([])
    setCargandoCitas(true)
    try {
      setCitas(await apiGet<CitaPaciente[]>(`/api/citas?idPaciente=${paciente.idPaciente}`))
    } catch {
      setCitas([])
    } finally {
      setCargandoCitas(false)
    }
  }

  /* ---------- Formulario ---------- */

  const abrirNuevo = () => {
    setEditando(null)
    setForm(VACIO)
    setApoderadoManual(false)
    setErrores({})
    setErrorForm('')
    setDialogo(true)
  }

  const abrirEditar = (p: Paciente) => {
    setEditando(p)
    setForm({
      rut: p.rut,
      nombres: p.nombres,
      apellidos: p.apellidos,
      fechaNacimiento: p.fechaNacimiento,
      telefono: p.telefono ?? '',
      correo: p.correo ?? '',
      direccion: p.direccion ?? '',
      apoderadoNombre: p.apoderadoNombre ?? '',
      apoderadoRut: p.apoderadoRut ?? '',
      apoderadoTelefono: p.apoderadoTelefono ?? '',
    })
    setApoderadoManual(false)
    setErrores({})
    setErrorForm('')
    setDialogo(true)
  }

  const cambiar = (campo: keyof Formulario) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const valor = e.target.value
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((er) => ({ ...er, [campo]: undefined }))
  }

  const guardar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const creando = editando === null
    const nuevos = validar(form, creando)
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const cuerpo = {
      rut: form.rut.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      fechaNacimiento: form.fechaNacimiento,
      telefono: form.telefono.trim() || null,
      correo: form.correo.trim() || null,
      direccion: form.direccion.trim() || null,
      apoderadoNombre: form.apoderadoNombre.trim() || null,
      apoderadoRut: form.apoderadoRut.trim() || null,
      apoderadoTelefono: form.apoderadoTelefono.trim() || null,
    }

    setGuardando(true)
    setErrorForm('')
    try {
      const guardado = creando
        ? await apiPost<Paciente>('/api/pacientes', cuerpo)
        : await apiPut<Paciente>(`/api/pacientes/${editando.idPaciente}`, cuerpo)
      setAviso(creando ? 'Paciente registrado.' : 'Datos actualizados.')
      setDialogo(false)
      await cargar()
      if (detalle && detalle.idPaciente === guardado.idPaciente) setDetalle(guardado)
    } catch (err) {
      setErrorForm(mensajeError(err, 'No fue posible guardar el paciente.'))
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEstado = async () => {
    if (!cambioEstado) return
    setGuardando(true)
    setErrorEstado('')
    try {
      const accion = cambioEstado.activo ? 'desactivar' : 'activar'
      const actualizado = await apiPut<Paciente>(`/api/pacientes/${cambioEstado.idPaciente}/${accion}`)
      setAviso(cambioEstado.activo ? 'Paciente desactivado.' : 'Paciente activado.')
      setCambioEstado(null)
      await cargar()
      if (detalle && detalle.idPaciente === actualizado.idPaciente) setDetalle(actualizado)
    } catch (err) {
      setErrorEstado(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const creando = editando === null
  const edadForm = edadDesde(form.fechaNacimiento)
  const esMenor = edadForm !== null && edadForm < 18
  const mostrarApoderado = esMenor || apoderadoManual || Boolean(form.apoderadoNombre || form.apoderadoRut || form.apoderadoTelefono)

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}>
        <Box>
          <Typography variant="h5">Pacientes</Typography>
          <Typography color="text.secondary">
            {puedeEditar
              ? 'Registra pacientes nuevos y mantén al día sus datos de contacto.'
              : 'Consulta los datos y el historial de citas de los pacientes.'}
          </Typography>
        </Box>
        {puedeEditar && (
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={abrirNuevo} sx={{ background: GRADIENT, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
            Nuevo paciente
          </Button>
        )}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { titulo: 'Activos', valor: resumen.activos },
          { titulo: 'Con próxima cita', valor: resumen.conProximaCita },
          { titulo: 'Con cuenta en el portal', valor: resumen.conCuenta },
          { titulo: 'Menores de edad', valor: resumen.menores },
        ].map((item) => (
          <Grid key={item.titulo} size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{item.titulo}</Typography>
              {cargando ? <Skeleton width={40} height={40} /> : (
                <Typography sx={{ fontSize: '1.7rem', fontWeight: 800 }}>{item.valor}</Typography>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {errorCarga && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={() => void cargar()}>Reintentar</Button>}>
          {errorCarga}
        </Alert>
      )}

      <Card>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField
            placeholder="Buscar por nombre, RUT, correo o teléfono"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
          />
          <TextField select label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as 'TODOS' | 'ACTIVOS' | 'INACTIVOS')} sx={{ minWidth: { md: 160 } }}>
            <MenuItem value="ACTIVOS">Activos</MenuItem>
            <MenuItem value="INACTIVOS">Inactivos</MenuItem>
            <MenuItem value="TODOS">Todos</MenuItem>
          </TextField>
          <TextField select label="Cuenta del portal" value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value as 'TODOS' | 'CON' | 'SIN')} sx={{ minWidth: { md: 190 } }}>
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="CON">Con cuenta</MenuItem>
            <MenuItem value="SIN">Sin cuenta</MenuItem>
          </TextField>
        </Stack>

        <TableContainer sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Paciente</TableCell>
                <TableCell>RUT</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Próxima cita</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando && [0, 1, 2, 3].map((i) => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton height={36} /></TableCell></TableRow>
              ))}

              {!cargando && filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                      <PeopleAltOutlinedIcon sx={{ fontSize: 42, color: '#c3cbe0' }} />
                      <Typography sx={{ mt: 1, fontWeight: 600 }}>
                        {pacientes.length === 0 ? 'Aún no hay pacientes registrados' : 'Ningún paciente coincide con la búsqueda'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!cargando && filtrados.map((p) => (
                <TableRow key={p.idPaciente} hover sx={{ cursor: 'pointer', opacity: p.activo ? 1 : 0.6 }} onClick={() => void abrirDetalle(p)}>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar sx={{ width: 38, height: 38, fontSize: '0.85rem', fontWeight: 800, bgcolor: '#eef4ff', color: '#2563eb' }}>
                        {`${p.nombres.charAt(0)}${p.apellidos.charAt(0)}`.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.nombres} {p.apellidos}</Typography>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">{p.edad ?? '—'} años</Typography>
                          {p.tieneCuenta && <Chip size="small" label="Portal" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#ecfeff', color: '#0e7490' }} />}
                          {(p.edad ?? 99) < 18 && <Chip size="small" label="Menor" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#fef3c7', color: '#b45309' }} />}
                        </Stack>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{p.rut}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{p.telefono || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.correo || 'Sin correo'}</Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {p.proximaCita ? fechaLarga(p.proximaCita) : <Typography variant="body2" color="text.secondary">Sin citas próximas</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" color={p.activo ? 'success' : 'default'} label={p.activo ? 'Activo' : 'Inactivo'} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Ver ficha">
                      <IconButton onClick={() => void abrirDetalle(p)} aria-label="Ver ficha"><VisibilityOutlinedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {puedeEditar && (
                      <>
                        <Tooltip title="Editar datos">
                          <IconButton onClick={() => abrirEditar(p)} aria-label="Editar datos"><EditOutlinedIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title={p.activo ? 'Desactivar' : 'Activar'}>
                          <IconButton color={p.activo ? 'error' : 'success'} onClick={() => { setCambioEstado(p); setErrorEstado('') }} aria-label={p.activo ? 'Desactivar' : 'Activar'}>
                            {p.activo ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineRoundedIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ===== Ficha lateral ===== */}
      <Drawer anchor="right" open={detalle !== null} onClose={() => setDetalle(null)} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 460 } } } }}>
        {detalle && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 3, color: '#fff', background: 'linear-gradient(135deg, #0a1628 0%, #10264a 100%)' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Avatar sx={{ width: 56, height: 56, fontWeight: 800, background: GRADIENT }}>
                  {`${detalle.nombres.charAt(0)}${detalle.apellidos.charAt(0)}`.toUpperCase()}
                </Avatar>
                <IconButton onClick={() => setDetalle(null)} sx={{ color: '#fff' }} aria-label="Cerrar"><CloseRoundedIcon /></IconButton>
              </Stack>
              <Typography variant="h6" sx={{ mt: 1.5 }}>{detalle.nombres} {detalle.apellidos}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,.7)' }}>{detalle.rut} · {detalle.edad ?? '—'} años</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Chip size="small" label={detalle.activo ? 'Activo' : 'Inactivo'} sx={{ bgcolor: detalle.activo ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.15)', color: '#fff' }} />
                <Chip size="small" label={detalle.tieneCuenta ? `Portal: ${detalle.usuarioCuenta}` : 'Sin cuenta en el portal'} sx={{ bgcolor: 'rgba(34,211,238,.18)', color: '#fff' }} />
              </Stack>
            </Box>

            <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Datos personales y contacto</Typography>
              <Dato icono={<CakeOutlinedIcon fontSize="small" />} etiqueta="Fecha de nacimiento" valor={fechaCorta(detalle.fechaNacimiento)} />
              <Dato icono={<PhoneOutlinedIcon fontSize="small" />} etiqueta="Teléfono" valor={detalle.telefono} />
              <Dato icono={<MailOutlineRoundedIcon fontSize="small" />} etiqueta="Correo" valor={detalle.correo} />
              <Dato icono={<HomeOutlinedIcon fontSize="small" />} etiqueta="Dirección" valor={detalle.direccion} />

              {(detalle.apoderadoNombre || (detalle.edad ?? 99) < 18) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary">Apoderado</Typography>
                  <Dato icono={<FamilyRestroomOutlinedIcon fontSize="small" />} etiqueta="Nombre" valor={detalle.apoderadoNombre} />
                  <Dato icono={<VerifiedUserOutlinedIcon fontSize="small" />} etiqueta="RUT" valor={detalle.apoderadoRut} />
                  <Dato icono={<PhoneOutlinedIcon fontSize="small" />} etiqueta="Teléfono" valor={detalle.apoderadoTelefono} />
                </>
              )}

              <Divider sx={{ my: 2 }} />
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Historial de citas ({detalle.totalCitas})</Typography>
                {puedeEditar && detalle.activo && (
                  <Button size="small" startIcon={<EventAvailableOutlinedIcon />} onClick={() => navigate(`/gestion/agenda?nuevaCita=${detalle.idPaciente}`)}>
                    Agendar
                  </Button>
                )}
              </Stack>

              {cargandoCitas && <Stack spacing={1}>{[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}</Stack>}
              {!cargandoCitas && citas.length === 0 && (
                <Typography variant="body2" color="text.secondary">Este paciente aún no tiene citas.</Typography>
              )}
              {!cargandoCitas && citas.length > 0 && (
                <Stack spacing={1}>
                  {citas.map((c) => {
                    const estado = ESTADO_CITA[c.estado] ?? { label: c.estado, color: 'default' as const }
                    return (
                      <Box key={c.idCita} sx={{ p: 1.5, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{fechaLarga(c.fechaHora)}</Typography>
                          <Chip size="small" variant="outlined" color={estado.color} label={estado.label} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {c.tipoAtencion || 'Atención dental'} · {c.odontologoNombre} · {c.sucursalNombre}
                        </Typography>
                      </Box>
                    )
                  })}
                </Stack>
              )}
            </Box>

            {puedeEditar && (
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => abrirEditar(detalle)} fullWidth>Editar datos</Button>
                <Button variant="outlined" color={detalle.activo ? 'error' : 'success'} onClick={() => { setCambioEstado(detalle); setErrorEstado('') }} fullWidth>
                  {detalle.activo ? 'Desactivar' : 'Activar'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Drawer>

      {/* ===== Formulario ===== */}
      <Dialog open={dialogo} onClose={() => !guardando && setDialogo(false)} fullWidth maxWidth="md">
        <Box component="form" onSubmit={guardar} noValidate>
          <DialogTitle sx={{ fontWeight: 800 }}>{creando ? 'Nuevo paciente' : 'Editar paciente'}</DialogTitle>
          <DialogContent dividers>
            {errorForm && <Alert severity="error" sx={{ mb: 2 }}>{errorForm}</Alert>}

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Identificación</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="RUT" required value={form.rut} onChange={cambiar('rut')}
                  onBlur={() => form.rut && setForm((f) => ({ ...f, rut: formatearRut(f.rut) }))}
                  disabled={!creando}
                  error={Boolean(errores.rut)}
                  helperText={errores.rut || (creando ? 'Ej: 12.345.678-5' : 'El RUT no se modifica')}
                  slotProps={{ htmlInput: { maxLength: 12 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Nombres" required value={form.nombres} onChange={cambiar('nombres')} error={Boolean(errores.nombres)} helperText={errores.nombres} slotProps={{ htmlInput: { maxLength: 100 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Apellidos" required value={form.apellidos} onChange={cambiar('apellidos')} error={Boolean(errores.apellidos)} helperText={errores.apellidos} slotProps={{ htmlInput: { maxLength: 100 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Fecha de nacimiento" type="date" required value={form.fechaNacimiento} onChange={cambiar('fechaNacimiento')}
                  error={Boolean(errores.fechaNacimiento)}
                  helperText={errores.fechaNacimiento || (edadForm !== null ? `${edadForm} años` : ' ')}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoyISO() } }}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1.5 }}>Contacto</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Teléfono" value={form.telefono} onChange={cambiar('telefono')} placeholder="+56 9 1234 5678" slotProps={{ htmlInput: { maxLength: 20 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField label="Correo" type="email" value={form.correo} onChange={cambiar('correo')} error={Boolean(errores.correo)} helperText={errores.correo} slotProps={{ htmlInput: { maxLength: 150 } }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Dirección" value={form.direccion} onChange={cambiar('direccion')} slotProps={{ htmlInput: { maxLength: 200 } }} />
              </Grid>
            </Grid>

            {mostrarApoderado ? (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1 }}>Apoderado</Typography>
                {esMenor && <Alert severity="info" sx={{ mb: 1.5 }}>El paciente es menor de edad: el nombre del apoderado es obligatorio.</Alert>}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Nombre del apoderado" required={esMenor} value={form.apoderadoNombre} onChange={cambiar('apoderadoNombre')} error={Boolean(errores.apoderadoNombre)} helperText={errores.apoderadoNombre} slotProps={{ htmlInput: { maxLength: 150 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField label="RUT apoderado" value={form.apoderadoRut} onChange={cambiar('apoderadoRut')} onBlur={() => form.apoderadoRut && setForm((f) => ({ ...f, apoderadoRut: formatearRut(f.apoderadoRut) }))} error={Boolean(errores.apoderadoRut)} helperText={errores.apoderadoRut} slotProps={{ htmlInput: { maxLength: 12 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField label="Teléfono apoderado" value={form.apoderadoTelefono} onChange={cambiar('apoderadoTelefono')} slotProps={{ htmlInput: { maxLength: 20 } }} />
                  </Grid>
                </Grid>
              </>
            ) : (
              <Button size="small" sx={{ mt: 2 }} startIcon={<FamilyRestroomOutlinedIcon />} onClick={() => setApoderadoManual(true)}>
                Agregar apoderado
              </Button>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button color="inherit" onClick={() => setDialogo(false)} disabled={guardando}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={guardando} sx={{ background: GRADIENT }}>
              {guardando ? <CircularProgress size={20} color="inherit" /> : creando ? 'Registrar paciente' : 'Guardar cambios'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ===== Activar / desactivar ===== */}
      <Dialog open={cambioEstado !== null} onClose={() => !guardando && setCambioEstado(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{cambioEstado?.activo ? 'Desactivar paciente' : 'Activar paciente'}</DialogTitle>
        <DialogContent>
          {errorEstado && <Alert severity="error" sx={{ mb: 2 }}>{errorEstado}</Alert>}
          <Typography>
            {cambioEstado?.activo
              ? 'El paciente no podrá reservar nuevas horas. Su historial y sus datos se conservan.'
              : 'El paciente podrá volver a reservar horas.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setCambioEstado(null)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" color={cambioEstado?.activo ? 'error' : 'success'} onClick={() => void confirmarEstado()} disabled={guardando}>
            {cambioEstado?.activo ? 'Desactivar' : 'Activar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={3500} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>{aviso}</Alert>
      </Snackbar>
    </Box>
  )
}

export default Pacientes
