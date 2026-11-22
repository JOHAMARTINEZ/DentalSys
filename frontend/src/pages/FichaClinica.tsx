import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
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
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined'

import { apiDelete, apiGet, apiPost, apiPut, getUsuarioSesion, mensajeError } from '../services/api'
import { alCerrar } from '../services/dialogos'
import EncabezadoPagina from '../components/ui/EncabezadoPagina'

/* =========================================================
   FICHA CLÍNICA (solo odontólogo)
   - Buscar paciente, ver/editar antecedentes y alergias.
   - Atenciones: registrar (desde una cita o sin cita),
     tratamientos realizados y piezas dentales (odontograma).
   - Borrador editable -> Cerrada (no se modifica).
   Endpoints: /api/fichas, /api/atenciones, /api/tratamientos
========================================================= */

// Degradado del color del rol (ver components/layout/temaRol.ts)
const GRADIENT = 'var(--rol-gradiente)'
const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

interface PacienteOpcion {
  idPaciente: number
  rut: string
  nombres: string
  apellidos: string
}

interface Ficha {
  idFicha: number | null
  fechaApertura: string | null
  antecedentesMedicos: string | null
  alergias: string | null
  observaciones: string | null
  idPaciente: number
  pacienteNombre: string
  rut: string
  edad: number | null
  telefono: string | null
  correo: string | null
  apoderadoNombre: string | null
}

interface Pieza {
  pieza: string
  superficies: string | null
  observacion?: string | null
}

interface TratamientoDetalle {
  idTratamiento: number
  nombre: string
  cantidad: number
  costoAplicado: number
  subtotal: number
  piezas: Pieza[]
}

interface Atencion {
  idAtencion: number
  fechaHora: string
  estado: 'BORRADOR' | 'CERRADA'
  diagnostico: string | null
  observaciones: string | null
  indicaciones: string | null
  idCita: number | null
  fechaCita: string | null
  idOdontologo: number
  odontologoNombre: string
  idSucursal: number
  sucursalNombre: string
  total: number
  tratamientos: TratamientoDetalle[]
}

interface Tratamiento {
  idTratamiento: number
  nombre: string
  costoBase: number
}

interface CitaOpcion {
  idCita: number
  fechaHora: string
  estado: string
  tipoAtencion: string | null
  sucursalNombre: string
  idAtencion: number | null
}

interface Sucursal {
  idSucursal: number
  nombre: string
}

interface Fila {
  clave: number
  idTratamiento: number | ''
  cantidad: string
  costo: string
  piezas: Pieza[]
}

function fechaHora(valor: string): string {
  return new Date(valor).toLocaleString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  })
}

/* =========================================================
   ODONTOGRAMA (notación FDI)
========================================================= */

const PERMANENTES = {
  superior: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
  inferior: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
}
const TEMPORALES = {
  superior: ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65'],
  inferior: ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75'],
}
const SUPERFICIES = ['O', 'M', 'D', 'V', 'P', 'L']
const NOMBRE_SUPERFICIE: Record<string, string> = {
  O: 'Oclusal', M: 'Mesial', D: 'Distal', V: 'Vestibular', P: 'Palatino', L: 'Lingual',
}

function Odontograma({ piezas, onChange, soloLectura }: {
  piezas: Pieza[]
  onChange: (p: Pieza[]) => void
  soloLectura?: boolean
}) {
  const [denticion, setDenticion] = useState<'permanente' | 'temporal'>(
    piezas.some((p) => Number(p.pieza[0]) >= 5) ? 'temporal' : 'permanente',
  )
  const arcadas = denticion === 'permanente' ? PERMANENTES : TEMPORALES
  const elegidas = new Set(piezas.map((p) => p.pieza))

  const alternar = (pieza: string) => {
    if (soloLectura) return
    onChange(elegidas.has(pieza)
      ? piezas.filter((p) => p.pieza !== pieza)
      : [...piezas, { pieza, superficies: null }].sort((a, b) => a.pieza.localeCompare(b.pieza)))
  }

  const alternarSuperficie = (pieza: string, sup: string) => {
    if (soloLectura) return
    onChange(piezas.map((p) => {
      if (p.pieza !== pieza) return p
      const actuales = (p.superficies ?? '').split(',').filter(Boolean)
      const nuevas = actuales.includes(sup) ? actuales.filter((s) => s !== sup) : [...actuales, sup]
      return { ...p, superficies: nuevas.length ? SUPERFICIES.filter((s) => nuevas.includes(s)).join(',') : null }
    }))
  }

  const fila = (lista: string[]) => (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
      {lista.map((pieza, i) => {
        const activa = elegidas.has(pieza)
        return (
          <Box key={pieza} sx={{ display: 'flex' }}>
            {i === lista.length / 2 && <Box sx={{ width: 10, borderLeft: '2px dashed', borderColor: 'divider', ml: 0.5 }} />}
            <Box
              component="button"
              type="button"
              onClick={() => alternar(pieza)}
              disabled={soloLectura}
              sx={{
                all: 'unset',
                cursor: soloLectura ? 'default' : 'pointer',
                width: 36,
                height: 44,
                borderRadius: '10px 10px 14px 14px',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: '0.78rem',
                border: '2px solid',
                borderColor: activa ? 'transparent' : '#d6deeb',
                color: activa ? '#fff' : '#526077',
                background: activa ? GRADIENT : '#fff',
                transition: 'all .15s',
                '&:hover': soloLectura ? {} : { borderColor: 'primary.light' },
              }}
            >
              {pieza}
            </Box>
          </Box>
        )
      })}
    </Box>
  )

  return (
    <Box>
      {!soloLectura && (
        <ToggleButtonGroup size="small" exclusive value={denticion} onChange={(_, v) => v && setDenticion(v)} sx={{ mb: 2 }}>
          <ToggleButton value="permanente">Permanente</ToggleButton>
          <ToggleButton value="temporal">Temporal</ToggleButton>
        </ToggleButtonGroup>
      )}
      <Stack spacing={1.5} sx={{ p: 2, borderRadius: 3, bgcolor: '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>Superior</Typography>
        {fila(arcadas.superior)}
        <Divider />
        {fila(arcadas.inferior)}
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>Inferior</Typography>
      </Stack>

      {piezas.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>Superficies (opcional)</Typography>
          {piezas.map((p) => (
            <Stack key={p.pieza} direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
              <Chip label={`Pieza ${p.pieza}`} color="primary" size="small" sx={{ minWidth: 80 }} />
              {SUPERFICIES.map((s) => {
                const activa = (p.superficies ?? '').split(',').includes(s)
                return (
                  <Tooltip key={s} title={NOMBRE_SUPERFICIE[s]}>
                    <Chip
                      label={s}
                      size="small"
                      variant={activa ? 'filled' : 'outlined'}
                      color={activa ? 'secondary' : 'default'}
                      onClick={soloLectura ? undefined : () => alternarSuperficie(p.pieza, s)}
                    />
                  </Tooltip>
                )
              })}
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  )
}

/* =========================================================
   PÁGINA
========================================================= */

let contadorFilas = 0
const nuevaFila = (): Fila => ({ clave: ++contadorFilas, idTratamiento: '', cantidad: '1', costo: '', piezas: [] })

function FichaClinica() {
  const sesion = getUsuarioSesion()
  const [searchParams, setSearchParams] = useSearchParams()

  const [pacientes, setPacientes] = useState<PacienteOpcion[]>([])
  const [paciente, setPaciente] = useState<PacienteOpcion | null>(null)

  const [ficha, setFicha] = useState<Ficha | null>(null)
  const [atenciones, setAtenciones] = useState<Atencion[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [pestana, setPestana] = useState(0)

  // Antecedentes
  const [antecedentes, setAntecedentes] = useState('')
  const [alergias, setAlergias] = useState('')
  const [observacionesFicha, setObservacionesFicha] = useState('')
  const [guardandoFicha, setGuardandoFicha] = useState(false)

  // Catálogos
  const [catalogo, setCatalogo] = useState<Tratamiento[]>([])
  const [misSucursales, setMisSucursales] = useState<Sucursal[]>([])

  // Editor de atención
  const [editor, setEditor] = useState(false)
  const [editando, setEditando] = useState<Atencion | null>(null)
  const [citas, setCitas] = useState<CitaOpcion[]>([])
  const [idCita, setIdCita] = useState<number | ''>('')
  const [idSucursal, setIdSucursal] = useState<number | ''>('')
  const [diagnostico, setDiagnostico] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [indicaciones, setIndicaciones] = useState('')
  const [filas, setFilas] = useState<Fila[]>([])
  const [filaPiezas, setFilaPiezas] = useState<number | null>(null)
  const [confirmarCierre, setConfirmarCierre] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [errorEditor, setErrorEditor] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [verAtencion, setVerAtencion] = useState<Atencion | null>(null)
  const [aviso, setAviso] = useState('')

  // Cambio de paciente con antecedentes sin guardar
  const [pacientePendiente, setPacientePendiente] = useState<PacienteOpcion | null | undefined>(undefined)
  // Evita mostrar la ficha de otro paciente si se cambia rápido
  const pacienteActual = useRef<number | null>(null)

  /* ---------- Carga inicial ---------- */

  useEffect(() => {
    Promise.all([
      apiGet<PacienteOpcion[]>('/api/pacientes?estado=ACTIVOS'),
      apiGet<Tratamiento[]>('/api/tratamientos'),
      apiGet<{ idUsuario: number; sucursales: number[] }[]>('/api/odontologos'),
      apiGet<Sucursal[]>('/api/sucursales'),
    ])
      .then(([p, t, o, s]) => {
        setPacientes(p)
        setCatalogo(t)
        const yo = o.find((x) => x.idUsuario === sesion.idUsuario)
        setMisSucursales(s.filter((suc) => yo?.sucursales.includes(suc.idSucursal)))
      })
      .catch((err) => setError(mensajeError(err, 'No fue posible cargar los datos iniciales.')))
  }, [sesion.idUsuario])

  const cargarPaciente = useCallback(async (idPaciente: number) => {
    pacienteActual.current = idPaciente
    setCargando(true)
    setError('')
    try {
      const [f, a, c] = await Promise.all([
        apiGet<Ficha>(`/api/fichas/paciente/${idPaciente}`),
        apiGet<Atencion[]>(`/api/atenciones?idPaciente=${idPaciente}`),
        apiGet<CitaOpcion[]>(`/api/citas?idPaciente=${idPaciente}`),
      ])
      if (pacienteActual.current !== idPaciente) return
      setFicha(f)
      setAntecedentes(f.antecedentesMedicos ?? '')
      setAlergias(f.alergias ?? '')
      setObservacionesFicha(f.observaciones ?? '')
      setAtenciones(a)
      setCitas(c.filter((x) => !x.idAtencion && ['RESERVADA', 'CONFIRMADA', 'COMPLETADA'].includes(x.estado)))
    } catch (err) {
      if (pacienteActual.current === idPaciente) setError(mensajeError(err, 'No fue posible cargar la ficha.'))
    } finally {
      if (pacienteActual.current === idPaciente) setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (paciente) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void cargarPaciente(paciente.idPaciente)
    } else {
      pacienteActual.current = null
      setFicha(null)
      setAtenciones([])
    }
  }, [paciente, cargarPaciente])

  /* ---------- Editor ---------- */

  const abrirNueva = useCallback((cita?: number) => {
    setEditando(null)
    setIdCita(cita ?? '')
    setIdSucursal(misSucursales.length === 1 ? misSucursales[0].idSucursal : '')
    setDiagnostico('')
    setObservaciones('')
    setIndicaciones('')
    setFilas([nuevaFila()])
    setErrorEditor('')
    setEditor(true)
  }, [misSucursales])

  // Desde la agenda: ?idPaciente=X&idCita=Y
  useEffect(() => {
    const idPaciente = Number(searchParams.get('idPaciente'))
    if (!idPaciente || pacientes.length === 0) return
    const encontrado = pacientes.find((p) => p.idPaciente === idPaciente)
    if (!encontrado) return
    const cita = Number(searchParams.get('idCita'))
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaciente(encontrado)
    if (cita) abrirNueva(cita)
  }, [searchParams, setSearchParams, pacientes, abrirNueva])

  const abrirEdicion = (a: Atencion) => {
    setEditando(a)
    setIdCita(a.idCita ?? '')
    setIdSucursal(a.idSucursal)
    setDiagnostico(a.diagnostico ?? '')
    setObservaciones(a.observaciones ?? '')
    setIndicaciones(a.indicaciones ?? '')
    setFilas(a.tratamientos.length
      ? a.tratamientos.map((t) => ({
        clave: ++contadorFilas,
        idTratamiento: t.idTratamiento,
        cantidad: String(t.cantidad),
        costo: String(Math.round(t.costoAplicado)),
        piezas: t.piezas,
      }))
      : [nuevaFila()])
    setErrorEditor('')
    setEditor(true)
  }

  const cambiarFila = (clave: number, cambios: Partial<Fila>) =>
    setFilas((lista) => lista.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)))

  const total = useMemo(
    () => filas.reduce((suma, f) => suma + (Number(f.cantidad) || 0) * (Number(f.costo) || 0), 0),
    [filas],
  )

  const cuerpoAtencion = () => {
    const usadas = filas.filter((f) => f.idTratamiento !== '')
    return {
      idCita: idCita || null,
      idPaciente: paciente?.idPaciente,
      idSucursal: idSucursal || null,
      diagnostico: diagnostico.trim() || null,
      observaciones: observaciones.trim() || null,
      indicaciones: indicaciones.trim() || null,
      tratamientos: usadas.map((f) => ({
        idTratamiento: f.idTratamiento,
        cantidad: Number(f.cantidad),
        costoAplicado: Number(f.costo),
        piezas: f.piezas,
      })),
    }
  }

  const validarEditor = (): string => {
    if (!editando && !idCita && !idSucursal) return 'Selecciona la cita o la sucursal de la atención.'
    for (const f of filas.filter((x) => x.idTratamiento !== '')) {
      if (!(Number(f.cantidad) >= 1)) return 'Revisa la cantidad de los tratamientos.'
      if (f.costo === '' || Number(f.costo) < 0) return 'Revisa el costo de los tratamientos.'
    }
    return ''
  }

  /** Guarda el borrador y devuelve la atención guardada. */
  const guardarBorrador = async (): Promise<Atencion | null> => {
    const problema = validarEditor()
    if (problema) { setErrorEditor(problema); return null }
    const cuerpo = cuerpoAtencion()
    return editando
      ? apiPut<Atencion>(`/api/atenciones/${editando.idAtencion}`, cuerpo)
      : apiPost<Atencion>('/api/atenciones', cuerpo)
  }

  const guardar = async () => {
    setGuardando(true)
    setErrorEditor('')
    try {
      const guardada = await guardarBorrador()
      if (!guardada) return
      setEditando(guardada)
      setAviso('Borrador guardado.')
      if (paciente) await cargarPaciente(paciente.idPaciente)
    } catch (err) {
      setErrorEditor(mensajeError(err, 'No fue posible guardar la atención.'))
    } finally {
      setGuardando(false)
    }
  }

  const cerrar = async () => {
    setGuardando(true)
    setErrorEditor('')
    try {
      const guardada = await guardarBorrador()
      if (!guardada) { setConfirmarCierre(false); return }
      await apiPut(`/api/atenciones/${guardada.idAtencion}/cerrar`)
      setAviso('Atención cerrada. La cita quedó como completada.')
      setConfirmarCierre(false)
      setEditor(false)
      if (paciente) await cargarPaciente(paciente.idPaciente)
    } catch (err) {
      setConfirmarCierre(false)
      setErrorEditor(mensajeError(err, 'No fue posible cerrar la atención.'))
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    if (!editando) return
    setGuardando(true)
    try {
      await apiDelete(`/api/atenciones/${editando.idAtencion}`)
      setAviso('Borrador eliminado.')
      setConfirmarEliminar(false)
      setEditor(false)
      if (paciente) await cargarPaciente(paciente.idPaciente)
    } catch (err) {
      setConfirmarEliminar(false)
      setErrorEditor(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  /* ---------- Antecedentes ---------- */

  const guardarFicha = async () => {
    if (!paciente) return
    setGuardandoFicha(true)
    try {
      const f = await apiPut<Ficha>(`/api/fichas/paciente/${paciente.idPaciente}`, {
        antecedentesMedicos: antecedentes,
        alergias,
        observaciones: observacionesFicha,
      })
      setFicha(f)
      setAviso('Antecedentes guardados.')
    } catch (err) {
      setError(mensajeError(err, 'No fue posible guardar la ficha.'))
    } finally {
      setGuardandoFicha(false)
    }
  }

  const fichaModificada = ficha !== null && (
    antecedentes !== (ficha.antecedentesMedicos ?? '') ||
    alergias !== (ficha.alergias ?? '') ||
    observacionesFicha !== (ficha.observaciones ?? ''))

  /** Cambia de paciente; si hay antecedentes sin guardar, pide confirmación. */
  const cambiarPaciente = (nuevo: PacienteOpcion | null) => {
    if (nuevo?.idPaciente === paciente?.idPaciente) return
    if (fichaModificada) {
      setPacientePendiente(nuevo)
      return
    }
    setPaciente(nuevo)
    setPestana(0)
  }

  const filaActual = filas.find((f) => f.clave === filaPiezas)
  const esPropia = (a: Atencion) => a.idOdontologo === sesion.idUsuario

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Box>
      <EncabezadoPagina
        icono={<DescriptionOutlinedIcon />}
        titulo="Ficha clínica"
        descripcion="Antecedentes del paciente, odontograma y registro de atenciones."
        acciones={(
          <Autocomplete
            options={pacientes}
            value={paciente}
            onChange={(_, v) => cambiarPaciente(v)}
            getOptionLabel={(p) => `${p.nombres} ${p.apellidos} · ${p.rut}`}
            isOptionEqualToValue={(a, b) => a.idPaciente === b.idPaciente}
            noOptionsText="Sin resultados"
            sx={{ width: { xs: '100%', md: 420 } }}
            renderInput={(params) => <TextField {...params} label="Buscar paciente" placeholder="Nombre o RUT" />}
          />
        )}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!paciente && (
        <Card sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
          <PersonSearchOutlinedIcon sx={{ fontSize: 54, color: '#c3cbe0' }} />
          <Typography sx={{ mt: 1.5, fontWeight: 700, color: 'text.primary' }}>Selecciona un paciente</Typography>
          <Typography variant="body2">Busca por nombre o RUT para abrir su ficha. También puedes llegar aquí desde una cita de tu agenda.</Typography>
        </Card>
      )}

      {paciente && cargando && <Skeleton variant="rounded" height={320} />}

      {paciente && !cargando && ficha && (
        <>
          {/* Encabezado del paciente */}
          <Card sx={{ p: { xs: 2.5, sm: 3 }, mb: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
              <Avatar sx={{ width: 56, height: 56, fontWeight: 800, background: GRADIENT }}>
                {`${paciente.nombres.charAt(0)}${paciente.apellidos.charAt(0)}`.toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{ficha.pacienteNombre}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {ficha.rut} · {ficha.edad ?? '—'} años{ficha.telefono ? ` · ${ficha.telefono}` : ''}
                  {ficha.apoderadoNombre ? ` · Apoderado: ${ficha.apoderadoNombre}` : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ficha.idFicha ? `Ficha abierta el ${new Date(`${ficha.fechaApertura}T00:00:00`).toLocaleDateString('es-CL')}` : 'Ficha aún no creada (se crea al guardar)'}
                </Typography>
              </Box>
              <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => abrirNueva()} sx={{ background: GRADIENT, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                Nueva atención
              </Button>
            </Stack>
            {ficha.alergias && (
              <Alert severity="warning" icon={<WarningAmberRoundedIcon />} sx={{ mt: 2 }}>
                <strong>Alergias:</strong> {ficha.alergias}
              </Alert>
            )}
          </Card>

          <Card>
            <Tabs value={pestana} onChange={(_, v) => setPestana(v)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Tab label={`Atenciones (${atenciones.length})`} />
              <Tab label={fichaModificada ? 'Antecedentes •' : 'Antecedentes'} />
            </Tabs>

            {/* ===== Atenciones ===== */}
            {pestana === 0 && (
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {atenciones.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                    <DescriptionOutlinedIcon sx={{ fontSize: 46, color: '#c3cbe0' }} />
                    <Typography sx={{ mt: 1, fontWeight: 600 }}>Sin atenciones registradas</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {atenciones.map((a) => (
                      <Box key={a.idAtencion} sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider', borderLeft: `4px solid ${a.estado === 'CERRADA' ? '#059669' : '#d97706'}` }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
                            <Typography sx={{ fontWeight: 800 }}>{fechaHora(a.fechaHora)}</Typography>
                            <Chip size="small" icon={a.estado === 'CERRADA' ? <LockOutlinedIcon /> : <EditNoteOutlinedIcon />} label={a.estado === 'CERRADA' ? 'Cerrada' : 'Borrador'} color={a.estado === 'CERRADA' ? 'success' : 'warning'} variant="outlined" />
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" onClick={() => setVerAtencion(a)}>Ver detalle</Button>
                            {a.estado === 'BORRADOR' && esPropia(a) && (
                              <Button size="small" variant="outlined" onClick={() => abrirEdicion(a)}>Continuar</Button>
                            )}
                          </Stack>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {a.odontologoNombre} · {a.sucursalNombre}{a.fechaCita ? ` · Cita del ${fechaHora(a.fechaCita)}` : ''}
                        </Typography>
                        {a.diagnostico && <Typography sx={{ mt: 1 }}><strong>Diagnóstico:</strong> {a.diagnostico}</Typography>}
                        {a.tratamientos.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                            {a.tratamientos.map((t) => (
                              <Chip key={t.idTratamiento} size="small" label={`${t.nombre}${t.cantidad > 1 ? ` ×${t.cantidad}` : ''}${t.piezas.length ? ` · ${t.piezas.map((p) => p.pieza).join(', ')}` : ''}`} sx={{ bgcolor: 'var(--rol-tint)', color: 'var(--rol-dark)' }} />
                            ))}
                            <Chip size="small" label={`Total ${pesos.format(a.total)}`} variant="outlined" />
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* ===== Antecedentes ===== */}
            {pestana === 1 && (
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack spacing={2.5}>
                  <TextField label="Antecedentes médicos" value={antecedentes} onChange={(e) => setAntecedentes(e.target.value)} multiline minRows={3} helperText="Enfermedades, cirugías, medicamentos en uso, embarazo, etc." />
                  <TextField label="Alergias" value={alergias} onChange={(e) => setAlergias(e.target.value)} multiline minRows={2} helperText="Se mostrarán destacadas en la ficha." />
                  <TextField label="Observaciones" value={observacionesFicha} onChange={(e) => setObservacionesFicha(e.target.value)} multiline minRows={2} />
                  <Box>
                    <Button variant="contained" startIcon={<SaveOutlinedIcon />} onClick={() => void guardarFicha()} disabled={!fichaModificada || guardandoFicha} sx={{ background: GRADIENT }}>
                      {guardandoFicha ? 'Guardando…' : 'Guardar antecedentes'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            )}
          </Card>
        </>
      )}

      {/* ===== Antecedentes sin guardar ===== */}
      <Dialog open={pacientePendiente !== undefined} onClose={alCerrar(() => setPacientePendiente(undefined))} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Cambios sin guardar</DialogTitle>
        <DialogContent>
          <Typography>
            Modificaste los antecedentes de {paciente?.nombres} {paciente?.apellidos} y no los has guardado.
            Si cambias de paciente, esos cambios se perderán.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setPacientePendiente(undefined)}>Volver</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              setPaciente(pacientePendiente ?? null)
              setPestana(0)
              setPacientePendiente(undefined)
            }}
          >
            Descartar y cambiar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Editor de atención ===== */}
      <Dialog open={editor} onClose={alCerrar(() => setEditor(false), { bloqueado: guardando })} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editando ? 'Atención (borrador)' : 'Nueva atención'} · {paciente?.nombres} {paciente?.apellidos}
        </DialogTitle>
        <DialogContent dividers>
          {errorEditor && <Alert severity="error" sx={{ mb: 2 }}>{errorEditor}</Alert>}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select label="Cita asociada" value={idCita}
                onChange={(e) => setIdCita(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={Boolean(editando)}
                helperText={editando ? 'No se puede cambiar' : 'Opcional: si atiendes una cita de tu agenda'}
              >
                <MenuItem value="">Sin cita (atención directa)</MenuItem>
                {citas.map((c) => (
                  <MenuItem key={c.idCita} value={c.idCita}>{fechaHora(c.fechaHora)} · {c.tipoAtencion || 'Atención'} · {c.sucursalNombre}</MenuItem>
                ))}
                {editando?.idCita && !citas.some((c) => c.idCita === editando.idCita) && (
                  <MenuItem value={editando.idCita}>{editando.fechaCita ? fechaHora(editando.fechaCita) : `Cita #${editando.idCita}`}</MenuItem>
                )}
              </TextField>
            </Grid>
            {!idCita && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField select label="Sucursal" required value={idSucursal} onChange={(e) => setIdSucursal(Number(e.target.value))} disabled={Boolean(editando)}>
                  {misSucursales.map((s) => <MenuItem key={s.idSucursal} value={s.idSucursal}>{s.nombre}</MenuItem>)}
                </TextField>
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField label="Diagnóstico" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} multiline minRows={2} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Observaciones clínicas" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} multiline minRows={3} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField label="Indicaciones al paciente" value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} multiline minRows={3} helperText="El paciente las verá en su portal cuando la atención esté cerrada." />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1">Tratamientos realizados</Typography>
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setFilas((l) => [...l, nuevaFila()])}>Agregar</Button>
          </Stack>

          {catalogo.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>El catálogo de tratamientos está vacío. Agrégalos en la página Tratamientos.</Alert>
          )}

          <Stack spacing={1.5}>
            {filas.map((f) => (
              <Grid container spacing={1.5} key={f.clave} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    select label="Tratamiento" value={f.idTratamiento}
                    onChange={(e) => {
                      const id = Number(e.target.value)
                      const t = catalogo.find((x) => x.idTratamiento === id)
                      cambiarFila(f.clave, { idTratamiento: id, costo: t ? String(Math.round(t.costoBase)) : f.costo })
                    }}
                  >
                    {catalogo.map((t) => <MenuItem key={t.idTratamiento} value={t.idTratamiento}>{t.nombre}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 4, md: 2 }}>
                  <TextField label="Cant." type="number" value={f.cantidad} onChange={(e) => cambiarFila(f.clave, { cantidad: e.target.value })} slotProps={{ htmlInput: { min: 1, max: 99 } }} />
                </Grid>
                <Grid size={{ xs: 8, md: 2 }}>
                  <TextField label="Costo unitario" type="number" value={f.costo} onChange={(e) => cambiarFila(f.clave, { costo: e.target.value })} slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> }, htmlInput: { min: 0, step: 500 } }} />
                </Grid>
                <Grid size={{ xs: 9, md: 2 }}>
                  <Button fullWidth variant="outlined" onClick={() => setFilaPiezas(f.clave)} disabled={f.idTratamiento === ''}>
                    {f.piezas.length ? `Piezas: ${f.piezas.map((p) => p.pieza).join(', ')}` : 'Piezas'}
                  </Button>
                </Grid>
                <Grid size={{ xs: 3, md: 1 }} sx={{ textAlign: 'right' }}>
                  <IconButton color="error" onClick={() => setFilas((l) => l.filter((x) => x.clave !== f.clave))} aria-label="Quitar tratamiento">
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Stack>

          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography color="text.secondary">Total de la atención</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem' }}>{pesos.format(total)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
          {editando && (
            <Button color="error" onClick={() => setConfirmarEliminar(true)} disabled={guardando}>Eliminar borrador</Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button color="inherit" onClick={() => setEditor(false)} disabled={guardando}>Salir</Button>
          <Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={() => void guardar()} disabled={guardando}>Guardar borrador</Button>
          <Button variant="contained" startIcon={<LockOutlinedIcon />} onClick={() => setConfirmarCierre(true)} disabled={guardando} sx={{ background: GRADIENT }}>
            Cerrar atención
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Piezas de un tratamiento ===== */}
      <Dialog open={filaActual !== undefined} onClose={alCerrar(() => setFilaPiezas(null))} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>
          Piezas dentales · {catalogo.find((t) => t.idTratamiento === filaActual?.idTratamiento)?.nombre}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Toca las piezas tratadas (notación FDI). Si el tratamiento no es de una pieza en particular, déjalo vacío.
          </Typography>
          {filaActual && (
            <Odontograma piezas={filaActual.piezas} onChange={(p) => cambiarFila(filaActual.clave, { piezas: p })} />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" onClick={() => setFilaPiezas(null)}>Listo</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Confirmaciones ===== */}
      <Dialog open={confirmarCierre} onClose={alCerrar(() => setConfirmarCierre(false), { bloqueado: guardando })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Cerrar atención</DialogTitle>
        <DialogContent>
          <Typography>Una vez cerrada, la atención no se puede modificar ni eliminar. Si viene de una cita, la cita quedará como completada.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setConfirmarCierre(false)} disabled={guardando}>Volver</Button>
          <Button variant="contained" onClick={() => void cerrar()} disabled={guardando} sx={{ background: GRADIENT }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Cerrar atención'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmarEliminar} onClose={alCerrar(() => setConfirmarEliminar(false), { bloqueado: guardando })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Eliminar borrador</DialogTitle>
        <DialogContent><Typography>Se descartará este borrador y sus tratamientos.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setConfirmarEliminar(false)} disabled={guardando}>Volver</Button>
          <Button variant="contained" color="error" onClick={() => void eliminar()} disabled={guardando}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      {/* ===== Detalle (solo lectura) ===== */}
      <Dialog open={verAtencion !== null} onClose={alCerrar(() => setVerAtencion(null), { escape: true })} fullWidth maxWidth="md">
        {verAtencion && (
          <>
            <DialogTitle sx={{ fontWeight: 800 }}>
              Atención del {fechaHora(verAtencion.fechaHora)}
              <Chip size="small" sx={{ ml: 1.5 }} label={verAtencion.estado === 'CERRADA' ? 'Cerrada' : 'Borrador'} color={verAtencion.estado === 'CERRADA' ? 'success' : 'warning'} variant="outlined" />
            </DialogTitle>
            <DialogContent dividers>
              <Stack direction="row" spacing={2} sx={{ color: 'text.secondary', mb: 2, flexWrap: 'wrap' }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}><EventOutlinedIcon fontSize="small" /><Typography variant="body2">{verAtencion.fechaCita ? `Cita del ${fechaHora(verAtencion.fechaCita)}` : 'Atención sin cita'}</Typography></Stack>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}><PlaceOutlinedIcon fontSize="small" /><Typography variant="body2">{verAtencion.sucursalNombre} · {verAtencion.odontologoNombre}</Typography></Stack>
              </Stack>
              {[
                ['Diagnóstico', verAtencion.diagnostico],
                ['Observaciones clínicas', verAtencion.observaciones],
                ['Indicaciones al paciente', verAtencion.indicaciones],
              ].map(([titulo, texto]) => (
                <Box key={titulo} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">{titulo}</Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{texto || '—'}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Tratamientos</Typography>
              {verAtencion.tratamientos.length === 0 && <Typography>—</Typography>}
              <Stack spacing={1}>
                {verAtencion.tratamientos.map((t) => (
                  <Stack key={t.idTratamiento} direction="row" sx={{ justifyContent: 'space-between', p: 1.25, borderRadius: 2, bgcolor: '#f8fafc' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{t.nombre} {t.cantidad > 1 && `×${t.cantidad}`}</Typography>
                      {t.piezas.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Piezas: {t.piezas.map((p) => `${p.pieza}${p.superficies ? ` (${p.superficies})` : ''}`).join(', ')}
                        </Typography>
                      )}
                    </Box>
                    <Typography sx={{ fontWeight: 700 }}>{pesos.format(t.subtotal)}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Typography sx={{ mt: 2, textAlign: 'right', fontWeight: 800, fontSize: '1.2rem' }}>Total {pesos.format(verAtencion.total)}</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              {verAtencion.estado === 'BORRADOR' && esPropia(verAtencion) && (
                <Button onClick={() => { const a = verAtencion; setVerAtencion(null); abrirEdicion(a) }}>Continuar edición</Button>
              )}
              <Button variant="contained" onClick={() => setVerAtencion(null)}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={3500} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>{aviso}</Alert>
      </Snackbar>
    </Box>
  )
}

export default FichaClinica
