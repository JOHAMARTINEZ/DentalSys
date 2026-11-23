import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

/* =========================================================
   TARJETA DE INDICADOR
   Número con título, ícono opcional y aparición escalonada.
========================================================= */

interface Props {
  titulo: string
  valor: ReactNode
  icono?: ReactNode
  detalle?: string
  cargando?: boolean
  /** Posición en la fila: escalona la animación de entrada */
  indice?: number
  /** Resalta el número (ej: pendientes) */
  destacado?: boolean
}

function Indicador({ titulo, valor, icono, detalle, cargando, indice = 0, destacado }: Props) {
  return (
    <Card
      sx={{
        p: 2,
        height: '100%',
        animation: `md-aparecer .45s ${indice * 60}ms cubic-bezier(.2,.8,.2,1) both`,
        '&:hover': { borderColor: 'primary.light', boxShadow: '0 12px 26px -20px var(--rol-sombra)' },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {titulo}
          </Typography>
          {cargando ? (
            <Skeleton width={44} height={42} />
          ) : (
            <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, lineHeight: 1.35, color: destacado ? 'primary.main' : 'text.primary' }}>
              {valor}
            </Typography>
          )}
          {detalle && (
            <Typography variant="caption" color="text.secondary">
              {detalle}
            </Typography>
          )}
        </Box>
        {icono && (
          <Box
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 2.5,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--rol-main)',
              backgroundColor: 'var(--rol-tint)',
              '& svg': { fontSize: 22 },
            }}
          >
            {icono}
          </Box>
        )}
      </Stack>
    </Card>
  )
}

export default Indicador
