import { useCallback, useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ButtonBase from '@mui/material/ButtonBase'

import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined'

import { apiGet, mensajeError } from '../services/api'

/* =========================================================
   MIS ATENCIONES (portal del paciente)
   Solo atenciones cerradas (GET /api/portal/atenciones):
   diagnóstico, indicaciones, tratamientos y piezas.
========================================================= */

const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

interface Atencion {
  idAtencion: number
  fechaHora: string
  diagnostico: string | null
  indicaciones: string | null
  odontologoNombre: string
  sucursalNombre: string
  total: number
  tratamientos: {
    idTratamiento: number
    nombre: string
    cantidad: number
    subtotal: number
    piezas: { pieza: string; superficies: string | null }[]
  }[]
}

function MisAtenciones() {
  const [atenciones, setAtenciones] = useState<Atencion[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [abierta, setAbierta] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const lista = await apiGet<Atencion[]>('/api/portal/atenciones')
      setAtenciones(lista)
      setAbierta(lista.length > 0 ? lista[0].idAtencion : null)
    } catch (err) {
      setError(mensajeError(err, 'No fue posible cargar tus atenciones.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  return (
    <Card sx={{ p: { xs: 2, sm: 3 }, boxShadow: '0 40px 80px -50px rgba(11,18,32,.45)' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cargando && <Stack spacing={1.5}>{[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={90} sx={{ borderRadius: 4 }} />)}</Stack>}

      {!cargando && atenciones.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <HistoryOutlinedIcon sx={{ fontSize: 48, color: '#c3cbe0' }} />
          <Typography sx={{ mt: 1, fontWeight: 700, color: 'text.primary' }}>Aún no tienes atenciones registradas</Typography>
          <Typography variant="body2">Después de cada atención, aquí verás las indicaciones de tu odontólogo.</Typography>
        </Box>
      )}

      <Stack spacing={1.5}>
        {atenciones.map((a) => {
          const expandida = abierta === a.idAtencion
          const fecha = new Date(a.fechaHora)
          return (
            <Box key={a.idAtencion} sx={{ borderRadius: 4, border: '1px solid', borderColor: expandida ? '#bfdbfe' : 'divider', overflow: 'hidden' }}>
              <ButtonBase
                onClick={() => setAbierta(expandida ? null : a.idAtencion)}
                sx={{ width: '100%', textAlign: 'left', p: 2, display: 'flex', gap: 2, justifyContent: 'flex-start', bgcolor: expandida ? '#f8fbff' : '#fff' }}
              >
                <Box sx={{ minWidth: 74, textAlign: 'center', py: 1, borderRadius: 3, bgcolor: '#eef4ff', color: '#2563eb' }}>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1.1 }}>{fecha.getDate()}</Typography>
                  <Typography sx={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {fecha.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800 }} noWrap>{a.diagnostico || 'Atención dental'}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {a.tratamientos.length > 0 ? a.tratamientos.map((t) => t.nombre).join(', ') : 'Sin tratamientos registrados'}
                  </Typography>
                </Box>
                <ExpandMoreRoundedIcon sx={{ transform: expandida ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: 'text.secondary' }} />
              </ButtonBase>

              <Collapse in={expandida}>
                <Box sx={{ px: 2.5, pb: 2.5 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 3 }} sx={{ color: 'text.secondary', mb: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><PersonOutlineRoundedIcon sx={{ fontSize: 18 }} /><Typography variant="body2">{a.odontologoNombre}</Typography></Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><PlaceOutlinedIcon sx={{ fontSize: 18 }} /><Typography variant="body2">{a.sucursalNombre}</Typography></Stack>
                  </Stack>

                  {a.indicaciones && (
                    <Alert icon={<TipsAndUpdatesOutlinedIcon />} severity="info" sx={{ mb: 2, borderRadius: 3, whiteSpace: 'pre-wrap' }}>
                      <strong>Indicaciones de tu odontólogo:</strong><br />{a.indicaciones}
                    </Alert>
                  )}

                  {a.tratamientos.length > 0 && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Tratamientos realizados</Typography>
                      <Stack spacing={1}>
                        {a.tratamientos.map((t) => (
                          <Stack key={t.idTratamiento} direction="row" sx={{ justifyContent: 'space-between', p: 1.25, borderRadius: 2, bgcolor: '#f8fafc', gap: 2 }}>
                            <Box>
                              <Typography sx={{ fontWeight: 700 }}>{t.nombre}{t.cantidad > 1 ? ` ×${t.cantidad}` : ''}</Typography>
                              {t.piezas.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {t.piezas.map((p) => <Chip key={p.pieza} size="small" label={`Pieza ${p.pieza}${p.superficies ? ` (${p.superficies})` : ''}`} />)}
                                </Box>
                              )}
                            </Box>
                            <Typography sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{pesos.format(t.subtotal)}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography sx={{ textAlign: 'right', fontWeight: 800 }}>Total {pesos.format(a.total)}</Typography>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          )
        })}
      </Stack>
    </Card>
  )
}

export default MisAtenciones
