import { useCallback, useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
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
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded'
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'

import { apiGet, apiPost, apiPut, getRol, getUsuarioSesion, mensajeError } from '../services/api'
import { imprimirComprobante, imprimirPresupuesto } from '../services/imprimir'
import { alCerrar } from '../services/dialogos'
import EncabezadoPagina from '../components/ui/EncabezadoPagina'
import Indicador from '../components/ui/Indicador'

/* =========================================================
   PRESUPUESTOS
   - Odontólogo: emite y edita (mientras está pendiente) sus
     presupuestos, con tratamientos y piezas dentales.
   - Recepción: registra la respuesta del paciente (aceptado /
     rechazado), los abonos y emite comprobantes.
   - El saldo viene de la vista vw_saldo_presupuesto.
========================================================= */

// Degradado del color del rol (ver components/layout/temaRol.ts)
const GRADIENT = 'var(--rol-gradiente)'
const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

type Estado = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'VENCIDO' | 'ANULADO'

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

interface Presupuesto {
  idPresupuesto: number
  fechaEmision: string
  fechaVencimiento: string
  estado: Estado
  montoTotal: number
  totalAbonado: number
  saldoPendiente: number
  idPaciente: number
  pacienteNombre: string
  pacienteRut: string
  idOdontologo: number
  odontologoNombre: string
  idSucursal: number
  sucursalNombre: string
  tratamientos: TratamientoDetalle[]
}

interface Pago {
  idPago: number
  fechaHora: string
  monto: number
  medioPago: string
  estado: 'PAGADO' | 'ANULADO'
  pacienteNombre: string
  pacienteRut: string
  concepto: string
  observacion: string | null
  registradoPor: string | null
  folio: string | null
  estadoComprobante: string | null
  sucursalNombre: string | null
  sucursalDireccion: string | null
  motivoAnulacion: string | null
}

interface PacienteOpcion {
  idPaciente: number
  rut: string
  nombres: string
  apellidos: string
}

interface Tratamiento {
  idTratamiento: number
  nombre: string
  costoBase: number
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

const ESTADOS: Record<Estado, { label: string; color: string; fondo: string }> = {
  PENDIENTE: { label: 'Pendiente', color: '#b45309', fondo: '#fef3c7' },
  ACEPTADO: { label: 'Aceptado', color: '#047857', fondo: '#d1fae5' },
  RECHAZADO: { label: 'Rechazado', color: '#b91c1c', fondo: '#fee2e2' },
  VENCIDO: { label: 'Vencido', color: '#64748b', fondo: '#f1f5f9' },
  ANULADO: { label: 'Anulado', color: '#64748b', fondo: '#f1f5f9' },
}

const MEDIOS = [
  { valor: 'EFECTIVO', label: 'Efectivo' },
  { valor: 'TARJETA', label: 'Tarjeta' },
  { valor: 'TRANSFERENCIA', label: 'Transferencia' },
]

function dia(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isoMasDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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


let contadorFilas = 0
const nuevaFila = (): Fila => ({ clave: ++contadorFilas, idTratamiento: '', cantidad: '1', costo: '', piezas: [] })

function Presupuestos() {
  const rol = getRol()
  const sesion = getUsuarioSesion()
  const esOdontologo = rol === 'ODONTOLOGO'
  const esRecepcion = rol === 'RECEPCIONISTA' || rol === 'ADMIN'

  const [lista, setLista] = useState<Presupuesto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<Estado | ''>('')
  const [busqueda, setBusqueda] = useState('')
  const [soloMios, setSoloMios] = useState(esOdontologo)

  const [pacientes, setPacientes] = useState<PacienteOpcion[]>([])
  const [catalogo, setCatalogo] = useState<Tratamiento[]>([])
  const [misSucursales, setMisSucursales] = useState<Sucursal[]>([])

  // Editor
  const [editor, setEditor] = useState(false)
  const [editando, setEditando] = useState<Presupuesto | null>(null)
  const [paciente, setPaciente] = useState<PacienteOpcion | null>(null)
  const [idSucursal, setIdSucursal] = useState<number | ''>('')
  const [vencimiento, setVencimiento] = useState(isoMasDias(30))
  const [filas, setFilas] = useState<Fila[]>([])
  const [filaPiezas, setFilaPiezas] = useState<number | null>(null)
  const [errorEditor, setErrorEditor] = useState('')

  // Detalle
  const [detalle, setDetalle] = useState<Presupuesto | null>(null)
  const [abonos, setAbonos] = useState<Pago[]>([])
  const [errorDetalle, setErrorDetalle] = useState('')
  const [confirmar, setConfirmar] = useState<Estado | null>(null)

  // Abono
  const [dlgAbono, setDlgAbono] = useState(false)
  const [montoAbono, setMontoAbono] = useState('')
  const [medioAbono, setMedioAbono] = useState('EFECTIVO')
  const [obsAbono, setObsAbono] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  // Último abono registrado: el aviso ofrece imprimir su comprobante
  const [ultimoPago, setUltimoPago] = useState<Pago | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      setLista(await apiGet<Presupuesto[]>(`/api/presupuestos${filtroEstado ? `?estado=${filtroEstado}` : ''}`))
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar los presupuestos.'))
    } finally {
      setCargando(false)
    }
  }, [filtroEstado])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  useEffect(() => {
    if (!esOdontologo) return
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
      .catch(() => {
        // Si falla, el editor mostrará listas vacías
      })
  }, [esOdontologo, sesion.idUsuario])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return lista.filter((p) =>
      (!soloMios || p.idOdontologo === sesion.idUsuario) &&
      (!texto || p.pacienteNombre.toLowerCase().includes(texto) || p.pacienteRut.toLowerCase().includes(texto) || String(p.idPresupuesto) === texto))
  }, [lista, busqueda, soloMios, sesion.idUsuario])

  const resumen = useMemo(() => ({
    pendientes: lista.filter((p) => p.estado === 'PENDIENTE').length,
    aceptados: lista.filter((p) => p.estado === 'ACEPTADO').length,
    porCobrar: lista.filter((p) => p.estado === 'ACEPTADO').reduce((t, p) => t + Number(p.saldoPendiente), 0),
    abonado: lista.filter((p) => p.estado === 'ACEPTADO').reduce((t, p) => t + Number(p.totalAbonado), 0),
  }), [lista])

  /* ---------- Editor ---------- */

  const abrirNuevo = () => {
    setEditando(null)
    setPaciente(null)
    setIdSucursal(misSucursales.length === 1 ? misSucursales[0].idSucursal : '')
    setVencimiento(isoMasDias(30))
    setFilas([nuevaFila()])
    setErrorEditor('')
    setEditor(true)
  }

  const abrirEdicion = (p: Presupuesto) => {
    setEditando(p)
    setPaciente(pacientes.find((x) => x.idPaciente === p.idPaciente) ?? { idPaciente: p.idPaciente, rut: p.pacienteRut, nombres: p.pacienteNombre, apellidos: '' })
    setIdSucursal(p.idSucursal)
    setVencimiento(p.fechaVencimiento)
    setFilas(p.tratamientos.map((t) => ({
      clave: ++contadorFilas,
      idTratamiento: t.idTratamiento,
      cantidad: String(t.cantidad),
      costo: String(Math.round(t.costoAplicado)),
      piezas: t.piezas,
    })))
    setErrorEditor('')
    setDetalle(null)
    setEditor(true)
  }

  const cambiarFila = (clave: number, cambios: Partial<Fila>) =>
    setFilas((l) => l.map((f) => (f.clave === clave ? { ...f, ...cambios } : f)))

  const totalEditor = useMemo(
    () => filas.reduce((s, f) => s + (Number(f.cantidad) || 0) * (Number(f.costo) || 0), 0),
    [filas],
  )

  const guardarPresupuesto = async () => {
    if (!paciente) { setErrorEditor('Selecciona el paciente.'); return }
    if (!idSucursal) { setErrorEditor('Selecciona la sucursal.'); return }
    const usadas = filas.filter((f) => f.idTratamiento !== '')
    if (usadas.length === 0) { setErrorEditor('Agrega al menos un tratamiento.'); return }
    if (usadas.some((f) => !(Number(f.cantidad) >= 1) || f.costo === '' || Number(f.costo) < 0)) {
      setErrorEditor('Revisa la cantidad y el valor de los tratamientos.')
      return
    }

    const cuerpo = {
      idPaciente: paciente.idPaciente,
      idSucursal,
      fechaVencimiento: vencimiento,
      tratamientos: usadas.map((f) => ({
        idTratamiento: f.idTratamiento,
        cantidad: Number(f.cantidad),
        costoAplicado: Number(f.costo),
        piezas: f.piezas,
      })),
    }

    setGuardando(true)
    setErrorEditor('')
    try {
      const guardado = editando
        ? await apiPut<Presupuesto>(`/api/presupuestos/${editando.idPresupuesto}`, cuerpo)
        : await apiPost<Presupuesto>('/api/presupuestos', cuerpo)
      setAviso(editando ? 'Presupuesto actualizado.' : `Presupuesto N° ${guardado.idPresupuesto} emitido.`)
      setEditor(false)
      await cargar()
    } catch (err) {
      setErrorEditor(mensajeError(err, 'No fue posible guardar el presupuesto.'))
    } finally {
      setGuardando(false)
    }
  }

  /* ---------- Detalle ---------- */

  const abrirDetalle = async (p: Presupuesto) => {
    setDetalle(p)
    setAbonos([])
    setErrorDetalle('')
    if (esRecepcion) {
      try {
        setAbonos(await apiGet<Pago[]>(`/api/pagos?idPresupuesto=${p.idPresupuesto}`))
      } catch {
        setAbonos([])
      }
    }
  }

  const refrescarDetalle = async (id: number) => {
    const actualizado = await apiGet<Presupuesto>(`/api/presupuestos/${id}`)
    await abrirDetalle(actualizado)
    await cargar()
  }

  const cambiarEstado = async () => {
    if (!detalle || !confirmar) return
    setGuardando(true)
    setErrorDetalle('')
    try {
      await apiPut(`/api/presupuestos/${detalle.idPresupuesto}/estado`, { estado: confirmar })
      setAviso(`Presupuesto ${ESTADOS[confirmar].label.toLowerCase()}.`)
      setConfirmar(null)
      await refrescarDetalle(detalle.idPresupuesto)
    } catch (err) {
      setConfirmar(null)
      setErrorDetalle(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const abrirAbono = () => {
    if (!detalle) return
    setMontoAbono(String(Math.round(detalle.saldoPendiente)))
    setMedioAbono('EFECTIVO')
    setObsAbono('')
    setErrorDetalle('')
    setDlgAbono(true)
  }

  const registrarAbono = async () => {
    if (!detalle) return
    const monto = Number(montoAbono)
    if (!(monto > 0)) { setErrorDetalle('Ingresa un monto mayor que cero.'); return }
    if (monto > Number(detalle.saldoPendiente)) { setErrorDetalle('El monto supera el saldo pendiente.'); return }

    setGuardando(true)
    setErrorDetalle('')
    try {
      const pago = await apiPost<Pago>('/api/pagos', {
        idPresupuesto: detalle.idPresupuesto,
        monto,
        medioPago: medioAbono,
        observacion: obsAbono.trim() || null,
      })
      setAviso(`Abono registrado. Comprobante ${pago.folio}.`)
      setUltimoPago(pago)
      setDlgAbono(false)
      await refrescarDetalle(detalle.idPresupuesto)
    } catch (err) {
      setErrorDetalle(mensajeError(err, 'No fue posible registrar el abono.'))
    } finally {
      setGuardando(false)
    }
  }

  const filaActual = filas.find((f) => f.clave === filaPiezas)

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Box>
      <EncabezadoPagina
        icono={<RequestQuoteOutlinedIcon />}
        titulo="Presupuestos"
        descripcion={esOdontologo
          ? 'Emite presupuestos de tratamiento para tus pacientes y revisa su avance.'
          : 'Registra la respuesta del paciente y sus abonos.'}
        acciones={esOdontologo && (
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={abrirNuevo} sx={{ background: GRADIENT }}>
            Nuevo presupuesto
          </Button>
        )}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { titulo: 'Pendientes de respuesta', valor: String(resumen.pendientes), icono: <PendingActionsOutlinedIcon />, destacado: !esOdontologo && resumen.pendientes > 0 },
          { titulo: 'Aceptados', valor: String(resumen.aceptados), icono: <TaskAltRoundedIcon /> },
          { titulo: 'Abonado (aceptados)', valor: pesos.format(resumen.abonado), icono: <SavingsOutlinedIcon /> },
          { titulo: 'Por cobrar', valor: pesos.format(resumen.porCobrar), icono: <AccountBalanceWalletOutlinedIcon /> },
        ].map((item, i) => (
          <Grid key={item.titulo} size={{ xs: 6, md: 3 }}>
            <Indicador titulo={item.titulo} valor={item.valor} icono={item.icono} destacado={item.destacado} cargando={cargando} indice={i} />
          </Grid>
        ))}
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ p: 2, mb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' } }}>
          <TextField
            placeholder="Buscar por paciente, RUT o N°"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
          />
          <TextField select label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as Estado | '')} sx={{ minWidth: { md: 180 } }}>
            <MenuItem value="">Todos</MenuItem>
            {(Object.keys(ESTADOS) as Estado[]).map((e) => <MenuItem key={e} value={e}>{ESTADOS[e].label}</MenuItem>)}
          </TextField>
          {esOdontologo && (
            <Chip label={soloMios ? 'Solo mis presupuestos' : 'Todos los odontólogos'} variant={soloMios ? 'filled' : 'outlined'} onClick={() => setSoloMios((v) => !v)} sx={{ flexShrink: 0 }} />
          )}
        </Stack>
      </Card>

      {cargando && <Stack spacing={1.5}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={96} />)}</Stack>}

      {!cargando && visibles.length === 0 && (
        <Card sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
          <RequestQuoteOutlinedIcon sx={{ fontSize: 48, color: '#c3cbe0' }} />
          <Typography sx={{ mt: 1, fontWeight: 600 }}>No hay presupuestos para mostrar</Typography>
        </Card>
      )}

      {!cargando && visibles.length > 0 && (
        <Grid container spacing={2}>
          {visibles.map((p, indice) => {
            const estado = ESTADOS[p.estado]
            const avance = Number(p.montoTotal) > 0 ? (Number(p.totalAbonado) / Number(p.montoTotal)) * 100 : 0
            return (
              <Grid key={p.idPresupuesto} size={{ xs: 12, md: 6, xl: 4 }}>
                <Card
                  onClick={() => void abrirDetalle(p)}
                  sx={{
                    p: 2.5,
                    cursor: 'pointer',
                    height: '100%',
                    transition: 'transform .2s ease, box-shadow .25s ease, border-color .25s ease',
                    animation: `md-aparecer .4s ${Math.min(indice, 8) * 40}ms cubic-bezier(.2,.8,.2,1) both`,
                    '&:hover': { borderColor: 'primary.light', transform: 'translateY(-2px)', boxShadow: '0 14px 30px -20px var(--rol-sombra)' },
                  }}
                >
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">N° {p.idPresupuesto} · {dia(p.fechaEmision)}</Typography>
                      <Typography sx={{ fontWeight: 800 }} noWrap>{p.pacienteNombre}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{p.odontologoNombre} · {p.sucursalNombre}</Typography>
                    </Box>
                    <Chip size="small" label={estado.label} sx={{ bgcolor: estado.fondo, color: estado.color }} />
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-end', mt: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Total</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.3rem' }}>{pesos.format(p.montoTotal)}</Typography>
                    </Box>
                    {p.estado === 'ACEPTADO' && (
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">Saldo</Typography>
                        <Typography sx={{ fontWeight: 800, color: Number(p.saldoPendiente) > 0 ? '#b45309' : '#047857' }}>
                          {Number(p.saldoPendiente) > 0 ? pesos.format(p.saldoPendiente) : 'Pagado'}
                        </Typography>
                      </Box>
                    )}
                    {p.estado === 'PENDIENTE' && (
                      <Typography variant="caption" color="text.secondary">Vence el {dia(p.fechaVencimiento)}</Typography>
                    )}
                  </Stack>
                  {p.estado === 'ACEPTADO' && <LinearProgress variant="determinate" value={avance} sx={{ mt: 1.5, height: 6, borderRadius: 3 }} />}
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* ===== Detalle ===== */}
      <Dialog open={detalle !== null && !dlgAbono && confirmar === null} onClose={alCerrar(() => setDetalle(null), { escape: true })} fullWidth maxWidth="md">
        {detalle && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              <Typography variant="h6" component="span">Presupuesto N° {detalle.idPresupuesto}</Typography>
              <Typography variant="body2" color="text.secondary">
                {detalle.pacienteNombre} · {detalle.pacienteRut}
              </Typography>
              <IconButton onClick={() => setDetalle(null)} sx={{ position: 'absolute', right: 12, top: 12 }} aria-label="Cerrar"><CloseRoundedIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {errorDetalle && <Alert severity="error" sx={{ mb: 2 }}>{errorDetalle}</Alert>}
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
                <Chip label={ESTADOS[detalle.estado].label} sx={{ bgcolor: ESTADOS[detalle.estado].fondo, color: ESTADOS[detalle.estado].color }} />
                <Chip variant="outlined" label={`Emitido ${dia(detalle.fechaEmision)}`} />
                <Chip variant="outlined" label={`Vence ${dia(detalle.fechaVencimiento)}`} />
                <Chip variant="outlined" label={`${detalle.odontologoNombre} · ${detalle.sucursalNombre}`} />
              </Stack>

              <Stack spacing={1}>
                {detalle.tratamientos.map((t) => (
                  <Stack key={t.idTratamiento} direction="row" sx={{ justifyContent: 'space-between', p: 1.25, borderRadius: 2, bgcolor: '#f8fafc', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{t.nombre} {t.cantidad > 1 && `×${t.cantidad}`}</Typography>
                      {t.piezas.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Piezas: {t.piezas.map((x) => `${x.pieza}${x.superficies ? ` (${x.superficies})` : ''}`).join(', ')}
                        </Typography>
                      )}
                    </Box>
                    <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{pesos.format(t.subtotal)}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                {[
                  { t: 'Total', v: detalle.montoTotal },
                  { t: 'Abonado', v: detalle.totalAbonado },
                  { t: 'Saldo', v: detalle.saldoPendiente },
                ].map((x) => (
                  <Grid key={x.t} size={{ xs: 4 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">{x.t}</Typography>
                      <Typography sx={{ fontWeight: 800 }}>{pesos.format(x.v)}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {esRecepcion && (
                <>
                  <Divider sx={{ my: 2.5 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Abonos</Typography>
                  {abonos.length === 0 && <Typography variant="body2" color="text.secondary">Sin abonos registrados.</Typography>}
                  <Stack spacing={1}>
                    {abonos.map((a) => (
                      <Stack key={a.idPago} direction="row" sx={{ alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider', opacity: a.estado === 'ANULADO' ? 0.6 : 1 }}>
                        <ReceiptLongOutlinedIcon color="action" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography sx={{ fontWeight: 700, textDecoration: a.estado === 'ANULADO' ? 'line-through' : 'none' }}>
                            {pesos.format(a.monto)} · {MEDIOS.find((m) => m.valor === a.medioPago)?.label ?? a.medioPago}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {a.folio} · {new Date(a.fechaHora).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23' })}
                            {a.estado === 'ANULADO' ? ' · Anulado' : ''}
                          </Typography>
                        </Box>
                        <Tooltip title="Imprimir comprobante">
                          <IconButton onClick={() => imprimirComprobante(a)} aria-label="Imprimir comprobante"><PrintOutlinedIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
              <Button startIcon={<PrintOutlinedIcon />} onClick={() => imprimirPresupuesto(detalle)}>Imprimir</Button>
              {(detalle.estado === 'PENDIENTE' || detalle.estado === 'ACEPTADO') && (esRecepcion || detalle.idOdontologo === sesion.idUsuario) && (
                <Button color="error" onClick={() => setConfirmar('ANULADO')}>Anular</Button>
              )}
              <Box sx={{ flexGrow: 1 }} />
              {esOdontologo && detalle.estado === 'PENDIENTE' && detalle.idOdontologo === sesion.idUsuario && (
                <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => abrirEdicion(detalle)}>Editar</Button>
              )}
              {esRecepcion && detalle.estado === 'PENDIENTE' && (
                <>
                  <Button variant="outlined" color="error" startIcon={<CloseRoundedIcon />} onClick={() => setConfirmar('RECHAZADO')}>Rechazado</Button>
                  <Button variant="contained" color="success" startIcon={<CheckRoundedIcon />} onClick={() => setConfirmar('ACEPTADO')}>Aceptado</Button>
                </>
              )}
              {esRecepcion && detalle.estado === 'ACEPTADO' && Number(detalle.saldoPendiente) > 0 && (
                <Button variant="contained" startIcon={<PaymentsOutlinedIcon />} onClick={abrirAbono} sx={{ background: GRADIENT }}>Registrar abono</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ===== Confirmar estado ===== */}
      <Dialog open={confirmar !== null} onClose={alCerrar(() => setConfirmar(null), { bloqueado: guardando })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {confirmar === 'ANULADO' ? 'Anular presupuesto' : confirmar === 'ACEPTADO' ? 'Registrar aceptación' : 'Registrar rechazo'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmar === 'ANULADO'
              ? 'El presupuesto quedará anulado y no se podrán registrar abonos.'
              : confirmar === 'ACEPTADO'
                ? 'Confirma que el paciente aceptó el presupuesto. Desde ahora se podrán registrar abonos.'
                : 'Confirma que el paciente rechazó el presupuesto.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setConfirmar(null)} disabled={guardando}>Volver</Button>
          <Button variant="contained" color={confirmar === 'ACEPTADO' ? 'success' : 'error'} onClick={() => void cambiarEstado()} disabled={guardando}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Abono ===== */}
      <Dialog open={dlgAbono} onClose={alCerrar(() => setDlgAbono(false), { bloqueado: guardando })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Registrar abono</DialogTitle>
        <DialogContent dividers>
          {errorDetalle && <Alert severity="error" sx={{ mb: 2 }}>{errorDetalle}</Alert>}
          {detalle && (
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Presupuesto N° {detalle.idPresupuesto} · Saldo {pesos.format(detalle.saldoPendiente)}
            </Typography>
          )}
          <Stack spacing={2.5}>
            <TextField label="Monto" type="number" value={montoAbono} onChange={(e) => setMontoAbono(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> }, htmlInput: { min: 1 } }} />
            <TextField select label="Medio de pago" value={medioAbono} onChange={(e) => setMedioAbono(e.target.value)}>
              {MEDIOS.map((m) => <MenuItem key={m.valor} value={m.valor}>{m.label}</MenuItem>)}
            </TextField>
            <TextField label="Observación (opcional)" value={obsAbono} onChange={(e) => setObsAbono(e.target.value)} slotProps={{ htmlInput: { maxLength: 250 } }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => { setDlgAbono(false); setErrorDetalle('') }} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={() => void registrarAbono()} disabled={guardando} sx={{ background: GRADIENT }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Registrar y emitir comprobante'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Editor ===== */}
      <Dialog open={editor} onClose={alCerrar(() => setEditor(false), { bloqueado: guardando })} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: 800 }}>{editando ? `Editar presupuesto N° ${editando.idPresupuesto}` : 'Nuevo presupuesto'}</DialogTitle>
        <DialogContent dividers>
          {errorEditor && <Alert severity="error" sx={{ mb: 2 }}>{errorEditor}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                options={pacientes}
                value={paciente}
                onChange={(_, v) => setPaciente(v)}
                disabled={Boolean(editando)}
                getOptionLabel={(p) => `${p.nombres} ${p.apellidos} · ${p.rut}`.replace(/ {2,}/g, ' ')}
                isOptionEqualToValue={(a, b) => a.idPaciente === b.idPaciente}
                renderInput={(params) => <TextField {...params} label="Paciente" required />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField select label="Sucursal" required value={idSucursal} onChange={(e) => setIdSucursal(Number(e.target.value))} disabled={Boolean(editando)}>
                {misSucursales.map((s) => <MenuItem key={s.idSucursal} value={s.idSucursal}>{s.nombre}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField type="date" label="Válido hasta" required value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: isoMasDias(0) } }} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1">Tratamientos</Typography>
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setFilas((l) => [...l, nuevaFila()])}>Agregar</Button>
          </Stack>
          {catalogo.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>El catálogo de tratamientos está vacío. Agrégalos en la página Tratamientos.</Alert>}

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
                  <TextField label="Valor unitario" type="number" value={f.costo} onChange={(e) => cambiarFila(f.clave, { costo: e.target.value })} slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> }, htmlInput: { min: 0, step: 500 } }} />
                </Grid>
                <Grid size={{ xs: 9, md: 2 }}>
                  <Button fullWidth variant="outlined" onClick={() => setFilaPiezas(f.clave)} disabled={f.idTratamiento === ''}>
                    {f.piezas.length ? `Piezas: ${f.piezas.map((p) => p.pieza).join(', ')}` : 'Piezas'}
                  </Button>
                </Grid>
                <Grid size={{ xs: 3, md: 1 }} sx={{ textAlign: 'right' }}>
                  <IconButton color="error" onClick={() => setFilas((l) => l.filter((x) => x.clave !== f.clave))} aria-label="Quitar tratamiento"><DeleteOutlineRoundedIcon /></IconButton>
                </Grid>
              </Grid>
            ))}
          </Stack>

          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography color="text.secondary">Total del presupuesto</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.5rem' }}>{pesos.format(totalEditor)}</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setEditor(false)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={() => void guardarPresupuesto()} disabled={guardando} sx={{ background: GRADIENT }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : editando ? 'Guardar cambios' : 'Emitir presupuesto'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Piezas ===== */}
      <Dialog open={filaActual !== undefined} onClose={alCerrar(() => setFilaPiezas(null))} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>Piezas dentales · {catalogo.find((t) => t.idTratamiento === filaActual?.idTratamiento)?.nombre}</DialogTitle>
        <DialogContent dividers>
          {filaActual && <Odontograma piezas={filaActual.piezas} onChange={(p) => cambiarFila(filaActual.clave, { piezas: p })} />}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="contained" onClick={() => setFilaPiezas(null)}>Listo</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={ultimoPago ? 8000 : 4000}
        onClose={(_, motivo) => { if (motivo !== 'clickaway') { setAviso(''); setUltimoPago(null) } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => { setAviso(''); setUltimoPago(null) }}
          action={ultimoPago ? (
            <Button color="inherit" size="small" startIcon={<PrintOutlinedIcon />} onClick={() => imprimirComprobante(ultimoPago)}>
              Imprimir
            </Button>
          ) : undefined}
        >
          {aviso}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Presupuestos
