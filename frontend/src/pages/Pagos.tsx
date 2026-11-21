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
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'

import { apiGet, apiPost, apiPut, mensajeError } from '../services/api'
import { imprimirComprobante } from '../services/imprimir'

/* =========================================================
   PAGOS Y COMPROBANTES (recepción y administración)
   - Lista de pagos por rango de fechas, con totales.
   - Registrar pago de un presupuesto aceptado o de una
     atención cerrada (según lo pendiente del paciente).
   - Anular con motivo (el comprobante también se anula).
   - Reimprimir comprobantes.
========================================================= */

const GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)'
const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

interface Pago {
  idPago: number
  fechaHora: string
  monto: number
  medioPago: string
  estado: 'PAGADO' | 'ANULADO'
  idPaciente: number
  pacienteNombre: string
  pacienteRut: string
  idPresupuesto: number | null
  idAtencion: number | null
  concepto: string
  observacion: string | null
  registradoPor: string | null
  fechaAnulacion: string | null
  anuladoPor: string | null
  motivoAnulacion: string | null
  folio: string | null
  estadoComprobante: string | null
  sucursalNombre: string | null
  sucursalDireccion: string | null
}

interface Pendiente {
  tipo: 'PRESUPUESTO' | 'ATENCION'
  id: number
  descripcion: string
  fecha: string
  total: number
  pagado: number
  saldo: number
}

interface PacienteOpcion {
  idPaciente: number
  rut: string
  nombres: string
  apellidos: string
}

const MEDIOS: Record<string, string> = { EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', TRANSFERENCIA: 'Transferencia' }

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fechaHora(valor: string): string {
  return new Date(valor).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23' })
}

function Pagos() {
  const hoy = new Date()
  const [desde, setDesde] = useState(iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)))
  const [hasta, setHasta] = useState(iso(hoy))
  const [filtroEstado, setFiltroEstado] = useState<'' | 'PAGADO' | 'ANULADO'>('')
  const [busqueda, setBusqueda] = useState('')

  const [pagos, setPagos] = useState<Pago[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Nuevo pago
  const [dlgNuevo, setDlgNuevo] = useState(false)
  const [pacientes, setPacientes] = useState<PacienteOpcion[]>([])
  const [paciente, setPaciente] = useState<PacienteOpcion | null>(null)
  const [pendientes, setPendientes] = useState<Pendiente[]>([])
  const [cargandoPendientes, setCargandoPendientes] = useState(false)
  const [elegido, setElegido] = useState<Pendiente | null>(null)
  const [monto, setMonto] = useState('')
  const [medio, setMedio] = useState('EFECTIVO')
  const [observacion, setObservacion] = useState('')

  // Anular
  const [anulando, setAnulando] = useState<Pago | null>(null)
  const [motivo, setMotivo] = useState('')

  const [errorDialogo, setErrorDialogo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    const params = new URLSearchParams()
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    if (filtroEstado) params.set('estado', filtroEstado)
    try {
      setPagos(await apiGet<Pago[]>(`/api/pagos?${params.toString()}`))
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar los pagos.'))
    } finally {
      setCargando(false)
    }
  }, [desde, hasta, filtroEstado])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return pagos.filter((p) => !texto
      || p.pacienteNombre.toLowerCase().includes(texto)
      || p.pacienteRut.toLowerCase().includes(texto)
      || (p.folio ?? '').toLowerCase().includes(texto))
  }, [pagos, busqueda])

  const resumen = useMemo(() => {
    const vigentes = pagos.filter((p) => p.estado === 'PAGADO')
    const porMedio = (m: string) => vigentes.filter((p) => p.medioPago === m).reduce((t, p) => t + Number(p.monto), 0)
    return {
      total: vigentes.reduce((t, p) => t + Number(p.monto), 0),
      cantidad: vigentes.length,
      efectivo: porMedio('EFECTIVO'),
      otros: porMedio('TARJETA') + porMedio('TRANSFERENCIA'),
      anulados: pagos.filter((p) => p.estado === 'ANULADO').length,
    }
  }, [pagos])

  /* ---------- Nuevo pago ---------- */

  const abrirNuevo = async () => {
    setPaciente(null)
    setPendientes([])
    setElegido(null)
    setMonto('')
    setMedio('EFECTIVO')
    setObservacion('')
    setErrorDialogo('')
    setDlgNuevo(true)
    if (pacientes.length === 0) {
      try {
        setPacientes(await apiGet<PacienteOpcion[]>('/api/pacientes'))
      } catch (err) {
        setErrorDialogo(mensajeError(err, 'No fue posible cargar los pacientes.'))
      }
    }
  }

  const elegirPaciente = async (p: PacienteOpcion | null) => {
    setPaciente(p)
    setPendientes([])
    setElegido(null)
    setMonto('')
    if (!p) return
    setCargandoPendientes(true)
    try {
      setPendientes(await apiGet<Pendiente[]>(`/api/pagos/pendientes?idPaciente=${p.idPaciente}`))
    } catch (err) {
      setErrorDialogo(mensajeError(err))
    } finally {
      setCargandoPendientes(false)
    }
  }

  const registrar = async () => {
    if (!elegido) { setErrorDialogo('Elige qué se está pagando.'); return }
    const valor = Number(monto)
    if (!(valor > 0)) { setErrorDialogo('Ingresa un monto mayor que cero.'); return }
    if (valor > Number(elegido.saldo)) { setErrorDialogo('El monto supera el saldo pendiente.'); return }

    setGuardando(true)
    setErrorDialogo('')
    try {
      const pago = await apiPost<Pago>('/api/pagos', {
        idPresupuesto: elegido.tipo === 'PRESUPUESTO' ? elegido.id : null,
        idAtencion: elegido.tipo === 'ATENCION' ? elegido.id : null,
        monto: valor,
        medioPago: medio,
        observacion: observacion.trim() || null,
      })
      setAviso(`Pago registrado. Comprobante ${pago.folio}.`)
      setDlgNuevo(false)
      imprimirComprobante(pago)
      await cargar()
    } catch (err) {
      setErrorDialogo(mensajeError(err, 'No fue posible registrar el pago.'))
    } finally {
      setGuardando(false)
    }
  }

  /* ---------- Anular ---------- */

  const confirmarAnulacion = async () => {
    if (!anulando) return
    if (!motivo.trim()) { setErrorDialogo('Indica el motivo de la anulación.'); return }
    setGuardando(true)
    setErrorDialogo('')
    try {
      await apiPut(`/api/pagos/${anulando.idPago}/anular`, { motivo: motivo.trim() })
      setAviso('Pago anulado. Su comprobante también quedó anulado.')
      setAnulando(null)
      await cargar()
    } catch (err) {
      setErrorDialogo(mensajeError(err, 'No fue posible anular el pago.'))
    } finally {
      setGuardando(false)
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}>
        <Box>
          <Typography variant="h5">Pagos y comprobantes</Typography>
          <Typography color="text.secondary">Registra abonos, emite comprobantes y revisa lo recaudado.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => void abrirNuevo()} sx={{ background: GRADIENT, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
          Registrar pago
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { t: 'Recaudado en el periodo', v: pesos.format(resumen.total) },
          { t: 'Pagos vigentes', v: String(resumen.cantidad) },
          { t: 'Efectivo', v: pesos.format(resumen.efectivo) },
          { t: 'Tarjeta y transferencia', v: pesos.format(resumen.otros) },
        ].map((x) => (
          <Grid key={x.t} size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{x.t}</Typography>
              {cargando ? <Skeleton width={90} height={40} /> : <Typography sx={{ fontSize: '1.5rem', fontWeight: 800 }}>{x.v}</Typography>}
            </Card>
          </Grid>
        ))}
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField
            placeholder="Buscar por paciente, RUT o folio"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
          />
          <TextField type="date" label="Desde" value={desde} onChange={(e) => setDesde(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: { md: 170 } }} />
          <TextField type="date" label="Hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ minWidth: { md: 170 } }} />
          <TextField select label="Estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as '' | 'PAGADO' | 'ANULADO')} sx={{ minWidth: { md: 150 } }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="PAGADO">Pagados</MenuItem>
            <MenuItem value="ANULADO">Anulados ({resumen.anulados})</MenuItem>
          </TextField>
        </Stack>

        <TableContainer sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Folio</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Paciente</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell>Medio</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando && [0, 1, 2].map((i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton height={36} /></TableCell></TableRow>)}
              {!cargando && visibles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                      <ReceiptLongOutlinedIcon sx={{ fontSize: 42, color: '#c3cbe0' }} />
                      <Typography sx={{ mt: 1, fontWeight: 600 }}>No hay pagos en este periodo</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {!cargando && visibles.map((p) => (
                <TableRow key={p.idPago} hover sx={{ opacity: p.estado === 'ANULADO' ? 0.6 : 1 }}>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {p.folio}
                    {p.estado === 'ANULADO' && (
                      <Tooltip title={`Anulado por ${p.anuladoPor ?? '—'}: ${p.motivoAnulacion ?? ''}`}>
                        <Chip size="small" label="Anulado" color="error" variant="outlined" sx={{ ml: 1 }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fechaHora(p.fechaHora)}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.pacienteNombre}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.pacienteRut}</Typography>
                  </TableCell>
                  <TableCell>
                    {p.concepto}
                    {(p.observacion ?? '').toLowerCase().includes('demostración') && <Chip size="small" label="Demo" color="warning" variant="outlined" sx={{ ml: 1 }} />}
                  </TableCell>
                  <TableCell>{MEDIOS[p.medioPago] ?? p.medioPago}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: 'nowrap', textDecoration: p.estado === 'ANULADO' ? 'line-through' : 'none' }}>{pesos.format(p.monto)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Imprimir comprobante">
                      <IconButton onClick={() => imprimirComprobante(p)} aria-label="Imprimir comprobante"><PrintOutlinedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {p.estado === 'PAGADO' && (
                      <Tooltip title="Anular pago">
                        <IconButton color="error" onClick={() => { setAnulando(p); setMotivo(''); setErrorDialogo('') }} aria-label="Anular pago"><BlockOutlinedIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ===== Registrar pago ===== */}
      <Dialog open={dlgNuevo} onClose={() => !guardando && setDlgNuevo(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Registrar pago</DialogTitle>
        <DialogContent dividers>
          {errorDialogo && <Alert severity="error" sx={{ mb: 2 }}>{errorDialogo}</Alert>}
          <Stack spacing={2.5}>
            <Autocomplete
              options={pacientes}
              value={paciente}
              onChange={(_, v) => void elegirPaciente(v)}
              getOptionLabel={(p) => `${p.nombres} ${p.apellidos} · ${p.rut}`}
              isOptionEqualToValue={(a, b) => a.idPaciente === b.idPaciente}
              renderInput={(params) => <TextField {...params} label="Paciente" required />}
            />

            {paciente && (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>¿Qué se está pagando?</Typography>
                {cargandoPendientes && <Skeleton variant="rounded" height={60} />}
                {!cargandoPendientes && pendientes.length === 0 && (
                  <Alert severity="info">
                    El paciente no tiene saldos pendientes. Los presupuestos deben estar aceptados y las atenciones cerradas.
                  </Alert>
                )}
                <Stack spacing={1}>
                  {pendientes.map((p) => {
                    const activo = elegido?.tipo === p.tipo && elegido.id === p.id
                    return (
                      <Box
                        key={`${p.tipo}-${p.id}`}
                        component="button"
                        type="button"
                        onClick={() => { setElegido(p); setMonto(String(Math.round(p.saldo))) }}
                        sx={{
                          all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', p: 1.5, borderRadius: 2.5,
                          border: '2px solid', borderColor: activo ? 'primary.main' : 'divider', bgcolor: activo ? '#eef4ff' : '#fff',
                          display: 'flex', justifyContent: 'space-between', gap: 2,
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>{p.descripcion}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total {pesos.format(p.total)} · Pagado {pesos.format(p.pagado)}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" color="text.secondary">Saldo</Typography>
                          <Typography sx={{ fontWeight: 800 }}>{pesos.format(p.saldo)}</Typography>
                        </Box>
                      </Box>
                    )
                  })}
                </Stack>
              </Box>
            )}

            {elegido && (
              <>
                <TextField label="Monto" type="number" value={monto} onChange={(e) => setMonto(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> }, htmlInput: { min: 1 } }} />
                <TextField select label="Medio de pago" value={medio} onChange={(e) => setMedio(e.target.value)}>
                  {Object.entries(MEDIOS).map(([valor, label]) => <MenuItem key={valor} value={valor}>{label}</MenuItem>)}
                </TextField>
                <TextField label="Observación (opcional)" value={observacion} onChange={(e) => setObservacion(e.target.value)} slotProps={{ htmlInput: { maxLength: 250 } }} />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setDlgNuevo(false)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={() => void registrar()} disabled={guardando || !elegido} sx={{ background: GRADIENT }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Registrar y emitir comprobante'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Anular ===== */}
      <Dialog open={anulando !== null} onClose={() => !guardando && setAnulando(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Anular pago</DialogTitle>
        <DialogContent>
          {errorDialogo && <Alert severity="error" sx={{ mb: 2 }}>{errorDialogo}</Alert>}
          {anulando && (
            <Typography sx={{ mb: 2 }}>
              {anulando.folio} · {pesos.format(anulando.monto)} · {anulando.pacienteNombre}. El pago y su comprobante quedarán anulados (no se eliminan).
            </Typography>
          )}
          <TextField label="Motivo" required value={motivo} onChange={(e) => setMotivo(e.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 250 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setAnulando(null)} disabled={guardando}>Volver</Button>
          <Button variant="contained" color="error" onClick={() => void confirmarAnulacion()} disabled={guardando}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Anular pago'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={4000} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>{aviso}</Alert>
      </Snackbar>
    </Box>
  )
}

export default Pagos
