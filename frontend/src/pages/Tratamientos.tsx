import { useCallback, useEffect, useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
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
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'

import { apiGet, apiPost, apiPut, mensajeError } from '../services/api'

/* =========================================================
   CATÁLOGO DE TRATAMIENTOS (ADMIN y ODONTÓLOGO)
   Nombre, descripción y costo base de referencia. En cada
   atención o presupuesto se puede aplicar otro valor.
   Los tratamientos no se eliminan: se desactivan.
========================================================= */

const GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)'

interface Tratamiento {
  idTratamiento: number
  nombre: string
  descripcion: string | null
  costoBase: number
  activo: boolean
  usos: number
}

const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

function Tratamientos() {
  const [lista, setLista] = useState<Tratamiento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [verInactivos, setVerInactivos] = useState(false)

  const [dialogo, setDialogo] = useState(false)
  const [editando, setEditando] = useState<Tratamiento | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [costo, setCosto] = useState('')
  const [errorDialogo, setErrorDialogo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      setLista(await apiGet<Tratamiento[]>('/api/tratamientos?todos=true'))
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar los tratamientos.'))
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
    return lista.filter((t) =>
      (verInactivos || t.activo) &&
      (!texto || t.nombre.toLowerCase().includes(texto) || (t.descripcion ?? '').toLowerCase().includes(texto)))
  }, [lista, busqueda, verInactivos])

  const abrir = (t?: Tratamiento) => {
    setEditando(t ?? null)
    setNombre(t?.nombre ?? '')
    setDescripcion(t?.descripcion ?? '')
    setCosto(t ? String(Math.round(t.costoBase)) : '')
    setErrorDialogo('')
    setDialogo(true)
  }

  const guardar = async () => {
    if (!nombre.trim()) { setErrorDialogo('Ingresa el nombre.'); return }
    const valor = Number(costo)
    if (costo === '' || Number.isNaN(valor) || valor < 0) { setErrorDialogo('Ingresa un costo base válido (0 o más).'); return }

    setGuardando(true)
    setErrorDialogo('')
    const cuerpo = { nombre: nombre.trim(), descripcion: descripcion.trim() || null, costoBase: valor }
    try {
      if (editando) {
        await apiPut(`/api/tratamientos/${editando.idTratamiento}`, cuerpo)
        setAviso('Tratamiento actualizado.')
      } else {
        await apiPost('/api/tratamientos', cuerpo)
        setAviso('Tratamiento agregado al catálogo.')
      }
      setDialogo(false)
      await cargar()
    } catch (err) {
      setErrorDialogo(mensajeError(err, 'No fue posible guardar el tratamiento.'))
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async (t: Tratamiento) => {
    try {
      await apiPut(`/api/tratamientos/${t.idTratamiento}/${t.activo ? 'desactivar' : 'activar'}`)
      setAviso(t.activo ? 'Tratamiento desactivado.' : 'Tratamiento activado.')
      await cargar()
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}>
        <Box>
          <Typography variant="h5">Catálogo de tratamientos</Typography>
          <Typography color="text.secondary">
            Los tratamientos que se usan en las atenciones y presupuestos, con su valor de referencia.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => abrir()} sx={{ background: GRADIENT, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
          Nuevo tratamiento
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2, alignItems: { sm: 'center' } }}>
          <TextField
            placeholder="Buscar tratamiento"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
          />
          <Chip
            label={verInactivos ? 'Mostrando inactivos' : 'Inactivos ocultos'}
            variant={verInactivos ? 'filled' : 'outlined'}
            onClick={() => setVerInactivos((v) => !v)}
            sx={{ flexShrink: 0 }}
          />
        </Stack>

        <TableContainer sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          <Table sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                <TableCell>Tratamiento</TableCell>
                <TableCell align="right">Costo base</TableCell>
                <TableCell align="center">Veces usado</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando && [0, 1, 2].map((i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton height={36} /></TableCell></TableRow>
              ))}
              {!cargando && filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                      <MedicalServicesOutlinedIcon sx={{ fontSize: 42, color: '#c3cbe0' }} />
                      <Typography sx={{ mt: 1, fontWeight: 600 }}>
                        {lista.length === 0 ? 'El catálogo está vacío. Agrega el primer tratamiento.' : 'Sin resultados'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {!cargando && filtrados.map((t) => (
                <TableRow key={t.idTratamiento} hover sx={{ opacity: t.activo ? 1 : 0.6 }}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>{t.nombre}</Typography>
                    {t.descripcion && <Typography variant="body2" color="text.secondary">{t.descripcion}</Typography>}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{pesos.format(t.costoBase)}</TableCell>
                  <TableCell align="center">{t.usos}</TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" color={t.activo ? 'success' : 'default'} label={t.activo ? 'Activo' : 'Inactivo'} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => abrir(t)} aria-label="Editar"><EditOutlinedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={t.activo ? 'Desactivar' : 'Activar'}>
                      <IconButton color={t.activo ? 'error' : 'success'} onClick={() => void cambiarEstado(t)} aria-label={t.activo ? 'Desactivar' : 'Activar'}>
                        {t.activo ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineRoundedIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogo} onClose={() => !guardando && setDialogo(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>{editando ? 'Editar tratamiento' : 'Nuevo tratamiento'}</DialogTitle>
        <DialogContent dividers>
          {errorDialogo && <Alert severity="error" sx={{ mb: 2 }}>{errorDialogo}</Alert>}
          <Stack spacing={2.5}>
            <TextField label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} slotProps={{ htmlInput: { maxLength: 150 } }} />
            <TextField label="Descripción (opcional)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} multiline minRows={2} />
            <TextField
              label="Costo base" required type="number" value={costo}
              onChange={(e) => setCosto(e.target.value)}
              helperText="Valor de referencia en pesos. Se puede ajustar en cada atención o presupuesto."
              slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> }, htmlInput: { min: 0, step: 500 } }}
            />
            {editando && editando.usos > 0 && (
              <Alert severity="info">Cambiar el costo base no modifica las atenciones ni presupuestos ya registrados.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setDialogo(false)} disabled={guardando}>Cancelar</Button>
          <Button variant="contained" onClick={() => void guardar()} disabled={guardando} sx={{ background: GRADIENT }}>
            {guardando ? <CircularProgress size={20} color="inherit" /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={3500} onClose={() => setAviso('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>{aviso}</Alert>
      </Snackbar>
    </Box>
  )
}

export default Tratamientos
