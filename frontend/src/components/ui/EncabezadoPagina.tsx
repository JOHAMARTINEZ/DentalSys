import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

/* =========================================================
   ENCABEZADO DE PÁGINA (portal de gestión)
   Ícono con el color del rol, título, descripción y acciones.
   Se usa igual en todas las páginas para que el sistema se vea
   coherente.
========================================================= */

interface Props {
  icono: ReactNode
  titulo: ReactNode
  descripcion?: ReactNode
  /** Botones a la derecha (en celular quedan debajo) */
  acciones?: ReactNode
}

function EncabezadoPagina({ icono, titulo, descripcion, acciones }: Props) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, mb: 3 }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Box
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: 3.5,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            background: 'var(--rol-gradiente)',
            boxShadow: '0 12px 24px -14px var(--rol-sombra)',
            '& svg': { fontSize: 26 },
          }}
        >
          {icono}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ lineHeight: 1.2 }}>
            {titulo}
          </Typography>
          {descripcion && (
            <Typography color="text.secondary" sx={{ mt: 0.25 }}>
              {descripcion}
            </Typography>
          )}
        </Box>
      </Stack>

      {acciones && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center', flexShrink: 0 }}>
          {acciones}
        </Stack>
      )}
    </Stack>
  )
}

export default EncabezadoPagina
