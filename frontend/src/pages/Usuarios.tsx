import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import FormHelperText from '@mui/material/FormHelperText'
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
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'

import {
  apiGet,
  apiPost,
  apiPut,
  getUsuarioSesion,
  mensajeError,
  ROL_LABEL,
} from '../services/api'
import type { Rol } from '../services/api'

/* =========================================================
   USUARIOS (solo ADMIN)
   - Lista de todas las cuentas (personal y pacientes).
   - Crear cuentas del personal: Administrador, Recepcionista
     u Odontólogo (con especialidad, registro y sucursales).
   - Editar datos, asignar nueva contraseña, activar/desactivar.
   Endpoints: /api/usuarios (ver UsuarioController).
========================================================= */

const GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)'

interface SucursalResumen {
  idSucursal: number
  nombre: string
}

interface Usuario {
  idUsuario: number
  rut: string
  nombres: string
  apellidos: string
  correo: string
  telefono: string | null
  username: string
  rol: Rol
  roles: string[]
  activo: boolean
  fechaCreacion: string | null
  especialidad: string | null
  numeroRegistroSalud: string | null
  sucursales: SucursalResumen[]
}

interface Sucursal {
  idSucursal: number
  nombre: string
  direccion: string
}

interface Formulario {
  rut: string
  nombres: string
  apellidos: string
  correo: string
  telefono: string
  username: string
  password: string
  rol: Rol | ''
  especialidad: string
  numeroRegistroSalud: string
  sucursales: number[]
}

const FORMULARIO_VACIO: Formulario = {
  rut: '',
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  username: '',
  password: '',
  rol: '',
  especialidad: '',
  numeroRegistroSalud: '',
  sucursales: [],
}

const ROLES_CREABLES: Rol[] = ['ADMIN', 'RECEPCIONISTA', 'ODONTOLOGO']

const COLOR_ROL: Record<Rol, { bg: string; fg: string }> = {
  ADMIN: { bg: '#ede9fe', fg: '#6d28d9' },
  RECEPCIONISTA: { bg: '#e0f2fe', fg: '#0369a1' },
  ODONTOLOGO: { bg: '#dbeafe', fg: '#1d4ed8' },
  PACIENTE: { bg: '#ecfeff', fg: '#0e7490' },
}

/* ---------- Validación de RUT (igual al backend) ---------- */

function limpiarRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase()
}

function rutValido(rut: string): boolean {
  const limpio = limpiarRut(rut)
  if (!/^\d{1,8}[0-9K]$/.test(limpio)) return false

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = 11 - (suma % 11)
  const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
  return dv === esperado
}

function formatearRut(rut: string): string {
  const limpio = limpiarRut(rut)
  if (limpio.length < 2) return rut
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpo}-${limpio.slice(-1)}`
}

/* ---------- Validación del formulario ---------- */

type Errores = Partial<Record<keyof Formulario, string>>

function validar(form: Formulario, creando: boolean): Errores {
  const errores: Errores = {}

  if (!form.rut.trim()) errores.rut = 'Ingresa el RUT.'
  else if (!rutValido(form.rut)) errores.rut = 'RUT no válido.'

  if (!form.nombres.trim()) errores.nombres = 'Ingresa los nombres.'
  if (!form.apellidos.trim()) errores.apellidos = 'Ingresa los apellidos.'

  if (!form.correo.trim()) errores.correo = 'Ingresa el correo.'
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.correo.trim())) errores.correo = 'Correo no válido.'

  if (!form.username.trim()) errores.username = 'Ingresa el nombre de usuario.'
  else if (!/^[a-zA-Z0-9._-]{3,50}$/.test(form.username.trim()))
    errores.username = 'Entre 3 y 50 caracteres: letras, números, punto o guion.'

  if (creando) {
    if (!form.rol) errores.rol = 'Selecciona un rol.'
    if (form.password.length < 8) errores.password = 'Mínimo 8 caracteres.'
  }

  if (form.rol === 'ODONTOLOGO') {
    if (!form.especialidad.trim()) errores.especialidad = 'Ingresa la especialidad.'
    if (!form.numeroRegistroSalud.trim()) errores.numeroRegistroSalud = 'Ingresa el número de registro.'
    if (form.sucursales.length === 0) errores.sucursales = 'Selecciona al menos una sucursal.'
  }

  return errores
}

function iniciales(usuario: Usuario): string {
  return `${usuario.nombres.charAt(0)}${usuario.apellidos.charAt(0)}`.toUpperCase()
}

/* =========================================================
   PÁGINA
========================================================= */

function Usuarios() {
  const sesion = getUsuarioSesion()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<Rol | 'TODOS'>('TODOS')
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS')

  // Diálogo crear / editar
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState<Formulario>(FORMULARIO_VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [errorDialogo, setErrorDialogo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [verPassword, setVerPassword] = useState(false)

  // Diálogo contraseña
  const [usuarioPassword, setUsuarioPassword] = useState<Usuario | null>(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [errorPassword, setErrorPassword] = useState('')

  // Diálogo activar / desactivar
  const [usuarioEstado, setUsuarioEstado] = useState<Usuario | null>(null)
  const [errorEstado, setErrorEstado] = useState('')

  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setErrorCarga('')
    try {
      const [listaUsuarios, listaSucursales] = await Promise.all([
        apiGet<Usuario[]>('/api/usuarios'),
        apiGet<Sucursal[]>('/api/sucursales'),
      ])
      setUsuarios(listaUsuarios)
      setSucursales(listaSucursales)
    } catch (err) {
      setErrorCarga(mensajeError(err, 'No fue posible cargar los usuarios.'))
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

    return usuarios.filter((usuario) => {
      if (filtroRol !== 'TODOS' && usuario.rol !== filtroRol) return false
      if (filtroEstado === 'ACTIVOS' && !usuario.activo) return false
      if (filtroEstado === 'INACTIVOS' && usuario.activo) return false
      if (!texto) return true

      const nombre = `${usuario.nombres} ${usuario.apellidos}`.toLowerCase()
      return (
        nombre.includes(texto) ||
        usuario.username.toLowerCase().includes(texto) ||
        usuario.correo.toLowerCase().includes(texto) ||
        (textoRut.length > 0 && limpiarRut(usuario.rut).includes(textoRut))
      )
    })
  }, [usuarios, busqueda, filtroRol, filtroEstado])

  const conteo = useMemo(() => ({
    total: usuarios.length,
    activos: usuarios.filter((u) => u.activo).length,
    personal: usuarios.filter((u) => u.rol !== 'PACIENTE').length,
    pacientes: usuarios.filter((u) => u.rol === 'PACIENTE').length,
  }), [usuarios])

  /* ---------- Crear / editar ---------- */

  const abrirCrear = () => {
    setEditando(null)
    setForm(FORMULARIO_VACIO)
    setErrores({})
    setErrorDialogo('')
    setVerPassword(false)
    setDialogoAbierto(true)
  }

  const abrirEditar = (usuario: Usuario) => {
    setEditando(usuario)
    setForm({
      rut: usuario.rut,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      telefono: usuario.telefono ?? '',
      username: usuario.username,
      password: '',
      rol: usuario.rol,
      especialidad: usuario.especialidad ?? '',
      numeroRegistroSalud: usuario.numeroRegistroSalud ?? '',
      sucursales: usuario.sucursales.map((s) => s.idSucursal),
    })
    setErrores({})
    setErrorDialogo('')
    setDialogoAbierto(true)
  }

  const cambiar = (campo: keyof Formulario) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const valor = event.target.value
    setForm((anterior) => ({ ...anterior, [campo]: valor }))
    setErrores((anterior) => ({ ...anterior, [campo]: undefined }))
  }

  const alternarSucursal = (idSucursal: number) => {
    setForm((anterior) => ({
      ...anterior,
      sucursales: anterior.sucursales.includes(idSucursal)
        ? anterior.sucursales.filter((id) => id !== idSucursal)
        : [...anterior.sucursales, idSucursal],
    }))
    setErrores((anterior) => ({ ...anterior, sucursales: undefined }))
  }

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const creando = editando === null
    const nuevosErrores = validar(form, creando)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const cuerpo = {
      rut: form.rut.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      correo: form.correo.trim(),
      telefono: form.telefono.trim() || null,
      username: form.username.trim(),
      password: creando ? form.password : null,
      rol: form.rol,
      especialidad: form.rol === 'ODONTOLOGO' ? form.especialidad.trim() : null,
      numeroRegistroSalud: form.rol === 'ODONTOLOGO' ? form.numeroRegistroSalud.trim() : null,
      sucursales: form.rol === 'ODONTOLOGO' ? form.sucursales : [],
    }

    setGuardando(true)
    setErrorDialogo('')
    try {
      if (creando) {
        await apiPost<Usuario>('/api/usuarios', cuerpo)
        setAviso('Usuario creado correctamente.')
      } else {
        await apiPut<Usuario>(`/api/usuarios/${editando.idUsuario}`, cuerpo)
        setAviso('Cambios guardados.')
      }
      setDialogoAbierto(false)
      await cargar()
    } catch (err) {
      setErrorDialogo(mensajeError(err, 'No fue posible guardar el usuario.'))
    } finally {
      setGuardando(false)
    }
  }

  /* ---------- Contraseña ---------- */

  const guardarPassword = async () => {
    if (!usuarioPassword) return
    if (nuevaPassword.length < 8) {
      setErrorPassword('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    setGuardando(true)
    setErrorPassword('')
    try {
      await apiPut<void>(`/api/usuarios/${usuarioPassword.idUsuario}/password`, { password: nuevaPassword })
      setAviso(`Se asignó una nueva contraseña a ${usuarioPassword.username}.`)
      setUsuarioPassword(null)
    } catch (err) {
      setErrorPassword(mensajeError(err, 'No fue posible cambiar la contraseña.'))
    } finally {
      setGuardando(false)
    }
  }

  /* ---------- Activar / desactivar ---------- */

  const confirmarEstado = async () => {
    if (!usuarioEstado) return
    const accion = usuarioEstado.activo ? 'desactivar' : 'activar'

    setGuardando(true)
    setErrorEstado('')
    try {
      await apiPut<Usuario>(`/api/usuarios/${usuarioEstado.idUsuario}/${accion}`)
      setAviso(usuarioEstado.activo ? 'Usuario desactivado.' : 'Usuario activado.')
      setUsuarioEstado(null)
      await cargar()
    } catch (err) {
      setErrorEstado(mensajeError(err, 'No fue posible cambiar el estado.'))
    } finally {
      setGuardando(false)
    }
  }

  const creando = editando === null
  const esPacienteEditado = editando?.rol === 'PACIENTE'

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Box>
      {/* Encabezado */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}
      >
        <Box>
          <Typography variant="h5">Usuarios del sistema</Typography>
          <Typography color="text.secondary">
            Crea las cuentas del personal y controla quién puede ingresar.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={abrirCrear}
          sx={{ background: GRADIENT, alignSelf: { xs: 'flex-start', sm: 'center' } }}
        >
          Nuevo usuario
        </Button>
      </Stack>

      {/* Resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { titulo: 'Total', valor: conteo.total },
          { titulo: 'Activos', valor: conteo.activos },
          { titulo: 'Personal', valor: conteo.personal },
          { titulo: 'Pacientes con cuenta', valor: conteo.pacientes },
        ].map((item) => (
          <Grid key={item.titulo} size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {item.titulo}
              </Typography>
              {cargando ? (
                <Skeleton width={40} height={40} />
              ) : (
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
        {/* Filtros */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField
            placeholder="Buscar por nombre, usuario, correo o RUT"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            label="Rol"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value as Rol | 'TODOS')}
            sx={{ minWidth: { md: 200 } }}
          >
            <MenuItem value="TODOS">Todos los roles</MenuItem>
            {(Object.keys(ROL_LABEL) as Rol[]).map((rol) => (
              <MenuItem key={rol} value={rol}>{ROL_LABEL[rol]}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as 'TODOS' | 'ACTIVOS' | 'INACTIVOS')}
            sx={{ minWidth: { md: 170 } }}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="ACTIVOS">Activos</MenuItem>
            <MenuItem value="INACTIVOS">Inactivos</MenuItem>
          </TextField>
        </Stack>

        {/* Tabla */}
        <TableContainer sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <Table sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell>Usuario</TableCell>
                <TableCell>RUT</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando &&
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton height={36} /></TableCell>
                  </TableRow>
                ))}

              {!cargando && filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                      <ManageAccountsOutlinedIcon sx={{ fontSize: 42, color: '#c3cbe0' }} />
                      <Typography sx={{ mt: 1, fontWeight: 600 }}>
                        {usuarios.length === 0 ? 'Aún no hay usuarios' : 'Ningún usuario coincide con la búsqueda'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}

              {!cargando &&
                filtrados.map((usuario) => {
                  const esYo = usuario.username === sesion.username
                  return (
                    <TableRow key={usuario.idUsuario} hover sx={{ opacity: usuario.activo ? 1 : 0.6 }}>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Avatar sx={{ width: 38, height: 38, fontSize: '0.85rem', fontWeight: 800, bgcolor: COLOR_ROL[usuario.rol].bg, color: COLOR_ROL[usuario.rol].fg }}>
                            {iniciales(usuario)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>
                              {usuario.nombres} {usuario.apellidos}
                              {esYo && (
                                <Typography component="span" variant="caption" color="primary" sx={{ ml: 1, fontWeight: 700 }}>
                                  (tú)
                                </Typography>
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{usuario.username}
                              {usuario.rol === 'ODONTOLOGO' && usuario.especialidad && ` · ${usuario.especialidad}`}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{usuario.rut}</TableCell>
                      <TableCell>{usuario.correo}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={ROL_LABEL[usuario.rol]}
                          sx={{ bgcolor: COLOR_ROL[usuario.rol].bg, color: COLOR_ROL[usuario.rol].fg }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={usuario.activo ? 'success' : 'default'}
                          label={usuario.activo ? 'Activo' : 'Inactivo'}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Editar datos">
                          <IconButton onClick={() => abrirEditar(usuario)} aria-label="Editar datos">
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Asignar nueva contraseña">
                          <IconButton
                            onClick={() => {
                              setUsuarioPassword(usuario)
                              setNuevaPassword('')
                              setErrorPassword('')
                            }}
                            aria-label="Asignar nueva contraseña"
                          >
                            <KeyOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={esYo ? 'No puedes desactivar tu propio usuario' : usuario.activo ? 'Desactivar' : 'Activar'}>
                          <span>
                            <IconButton
                              disabled={esYo}
                              color={usuario.activo ? 'error' : 'success'}
                              onClick={() => {
                                setUsuarioEstado(usuario)
                                setErrorEstado('')
                              }}
                              aria-label={usuario.activo ? 'Desactivar' : 'Activar'}
                            >
                              {usuario.activo ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineRoundedIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ===== Diálogo crear / editar ===== */}
      <Dialog open={dialogoAbierto} onClose={() => !guardando && setDialogoAbierto(false)} fullWidth maxWidth="md">
        <Box component="form" onSubmit={guardar} noValidate>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {creando ? 'Nuevo usuario' : `Editar a ${editando.nombres} ${editando.apellidos}`}
          </DialogTitle>
          <DialogContent dividers>
            {errorDialogo && <Alert severity="error" sx={{ mb: 2 }}>{errorDialogo}</Alert>}

            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Datos personales
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="RUT"
                  required
                  value={form.rut}
                  onChange={cambiar('rut')}
                  onBlur={() => form.rut && setForm((f) => ({ ...f, rut: formatearRut(f.rut) }))}
                  error={Boolean(errores.rut)}
                  helperText={errores.rut || 'Ej: 12.345.678-5'}
                  disabled={esPacienteEditado}
                  slotProps={{ htmlInput: { maxLength: 12 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Nombres" required value={form.nombres} onChange={cambiar('nombres')} error={Boolean(errores.nombres)} helperText={errores.nombres} slotProps={{ htmlInput: { maxLength: 100 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField label="Apellidos" required value={form.apellidos} onChange={cambiar('apellidos')} error={Boolean(errores.apellidos)} helperText={errores.apellidos} slotProps={{ htmlInput: { maxLength: 100 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Correo" type="email" required value={form.correo} onChange={cambiar('correo')} error={Boolean(errores.correo)} helperText={errores.correo} slotProps={{ htmlInput: { maxLength: 150 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Teléfono (opcional)" value={form.telefono} onChange={cambiar('telefono')} slotProps={{ htmlInput: { maxLength: 20 } }} />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1.5 }}>
              Acceso al sistema
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: creando ? 4 : 6 }}>
                <TextField
                  select
                  label="Rol"
                  required
                  value={form.rol}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, rol: e.target.value as Rol }))
                    setErrores((er) => ({ ...er, rol: undefined }))
                  }}
                  disabled={!creando}
                  error={Boolean(errores.rol)}
                  helperText={errores.rol || (!creando ? 'El rol no se cambia después de crear la cuenta.' : ' ')}
                >
                  {(creando ? ROLES_CREABLES : (Object.keys(ROL_LABEL) as Rol[])).map((rol) => (
                    <MenuItem key={rol} value={rol}>{ROL_LABEL[rol]}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: creando ? 4 : 6 }}>
                <TextField label="Nombre de usuario" required value={form.username} onChange={cambiar('username')} error={Boolean(errores.username)} helperText={errores.username || 'Con esto inicia sesión'} slotProps={{ htmlInput: { maxLength: 50 } }} />
              </Grid>
              {creando && (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    label="Contraseña"
                    required
                    type={verPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={cambiar('password')}
                    error={Boolean(errores.password)}
                    helperText={errores.password || 'Mínimo 8 caracteres'}
                    autoComplete="new-password"
                    slotProps={{
                      htmlInput: { maxLength: 72 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setVerPassword((v) => !v)} aria-label="Mostrar u ocultar contraseña">
                              {verPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              )}
            </Grid>

            {form.rol === 'ODONTOLOGO' && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1.5 }}>
                  Datos profesionales
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="Especialidad" required value={form.especialidad} onChange={cambiar('especialidad')} error={Boolean(errores.especialidad)} helperText={errores.especialidad || 'Ej: Odontología general'} slotProps={{ htmlInput: { maxLength: 100 } }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField label="N° registro Superintendencia de Salud" required value={form.numeroRegistroSalud} onChange={cambiar('numeroRegistroSalud')} error={Boolean(errores.numeroRegistroSalud)} helperText={errores.numeroRegistroSalud || ' '} slotProps={{ htmlInput: { maxLength: 50 } }} />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Sucursales donde atiende *
                    </Typography>
                    {sucursales.length === 0 ? (
                      <Alert severity="warning">No hay sucursales activas registradas.</Alert>
                    ) : (
                      <FormGroup row>
                        {sucursales.map((sucursal) => (
                          <FormControlLabel
                            key={sucursal.idSucursal}
                            control={
                              <Checkbox
                                checked={form.sucursales.includes(sucursal.idSucursal)}
                                onChange={() => alternarSucursal(sucursal.idSucursal)}
                              />
                            }
                            label={sucursal.nombre}
                          />
                        ))}
                      </FormGroup>
                    )}
                    {errores.sucursales && <FormHelperText error>{errores.sucursales}</FormHelperText>}
                  </Grid>
                </Grid>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setDialogoAbierto(false)} disabled={guardando} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" disabled={guardando} sx={{ background: GRADIENT }}>
              {guardando ? <CircularProgress size={20} color="inherit" /> : creando ? 'Crear usuario' : 'Guardar cambios'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ===== Diálogo nueva contraseña ===== */}
      <Dialog open={usuarioPassword !== null} onClose={() => !guardando && setUsuarioPassword(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Asignar nueva contraseña</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Usuario: <strong>{usuarioPassword?.username}</strong>. Comunícale la nueva contraseña de forma segura.
          </Typography>
          {errorPassword && <Alert severity="error" sx={{ mb: 2 }}>{errorPassword}</Alert>}
          <TextField
            label="Nueva contraseña"
            type={verPassword ? 'text' : 'password'}
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            helperText="Mínimo 8 caracteres"
            autoComplete="new-password"
            autoFocus
            slotProps={{
              htmlInput: { maxLength: 72 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setVerPassword((v) => !v)} aria-label="Mostrar u ocultar contraseña">
                      {verPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUsuarioPassword(null)} disabled={guardando} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={() => void guardarPassword()} disabled={guardando} sx={{ background: GRADIENT }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Diálogo activar / desactivar ===== */}
      <Dialog open={usuarioEstado !== null} onClose={() => !guardando && setUsuarioEstado(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {usuarioEstado?.activo ? 'Desactivar usuario' : 'Activar usuario'}
        </DialogTitle>
        <DialogContent>
          {errorEstado && <Alert severity="error" sx={{ mb: 2 }}>{errorEstado}</Alert>}
          <Typography>
            {usuarioEstado?.activo
              ? `${usuarioEstado.nombres} ${usuarioEstado.apellidos} no podrá iniciar sesión hasta que se vuelva a activar. Sus datos y su historial se conservan.`
              : `${usuarioEstado?.nombres} ${usuarioEstado?.apellidos} podrá volver a iniciar sesión.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUsuarioEstado(null)} disabled={guardando} color="inherit">Cancelar</Button>
          <Button
            variant="contained"
            color={usuarioEstado?.activo ? 'error' : 'success'}
            onClick={() => void confirmarEstado()}
            disabled={guardando}
          >
            {guardando ? <CircularProgress size={20} color="inherit" /> : usuarioEstado?.activo ? 'Desactivar' : 'Activar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={3500}
        onClose={() => setAviso('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>
          {aviso}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Usuarios
