import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'

import Box from '@mui/material/Box'
import GlobalStyles from '@mui/material/GlobalStyles'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import Sidebar from './Sidebar'
import Header from './Header'
import AsistenteIA from '../AsistenteIA'
import { temaDeRol, variablesCss } from './temaRol'
import { getRol } from '../../services/api'

/* =========================================================
   TEMA DEL PORTAL DE GESTIÓN
   Base común (azul marino, tipografía, tarjetas) y color de
   acento según el rol que inició sesión (ver temaRol.ts).
========================================================= */

// Debe coincidir con el ancho definido en Sidebar.tsx
const SIDEBAR_WIDTH = 264

const C = {
  ink: '#0b1220',
  muted: '#526077',
  line: '#e6eaf2',
  surface: '#f5f7fb',
  cyan: '#22d3ee',
}

function crearTema(main: string, dark: string, light: string) {
  return createTheme({
    palette: {
      primary: { main, dark, light },
      secondary: { main: C.cyan },
      text: { primary: C.ink, secondary: C.muted },
      divider: C.line,
      background: { default: C.surface, paper: '#ffffff' },
      success: { main: '#059669' },
      warning: { main: '#d97706' },
      error: { main: '#dc2626' },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: '"Plus Jakarta Sans Variable", system-ui, "Segoe UI", Roboto, sans-serif',
      h4: { fontWeight: 800, letterSpacing: '-0.025em' },
      h5: { fontWeight: 800, letterSpacing: '-0.02em' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 999,
            paddingLeft: 18,
            paddingRight: 18,
            transition: 'transform .15s ease, box-shadow .2s ease, background-color .2s ease, filter .2s ease',
            '&.MuiButton-contained:not(.Mui-disabled):hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 18px -8px var(--rol-sombra)',
              filter: 'brightness(1.04)',
            },
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${C.line}`,
            borderRadius: 18,
            transition: 'box-shadow .25s ease, border-color .25s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: { rounded: { borderRadius: 18 } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 20, animation: 'md-dialogo .28s cubic-bezier(.2,.8,.2,1)' },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small', fullWidth: true },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
      MuiTooltip: {
        defaultProps: { arrow: true },
      },
      MuiTableRow: {
        styleOverrides: {
          root: { transition: 'background-color .15s ease' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            color: C.muted,
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: C.surface,
          },
        },
      },
    },
  })
}

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const rol = getRol()
  const temaRol = temaDeRol(rol)
  const theme = useMemo(
    () => crearTema(temaRol.main, temaRol.dark, temaRol.light),
    [temaRol.main, temaRol.dark, temaRol.light],
  )

  return (
    <ThemeProvider theme={theme}>
      {/* Variables de color del rol: llegan también a diálogos y menús flotantes */}
      <GlobalStyles styles={{ ':root': variablesCss(temaRol) }} />

      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: C.surface }}>
        <Sidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          }}
        >
          <Header onMenuClick={() => setMobileOpen((abierto) => !abierto)} />

          {/* key: al cambiar de página se repite la animación de entrada.
              Espacio inferior extra para que el botón del asistente no tape contenido. */}
          <Box
            key={location.pathname}
            sx={{
              px: { xs: 2, sm: 3, lg: 4 },
              pt: { xs: 2.5, sm: 3.5 },
              pb: 12,
              maxWidth: 1440,
              mx: 'auto',
              animation: 'md-aparecer .35s cubic-bezier(.2,.8,.2,1)',
            }}
          >
            <Outlet />
          </Box>
        </Box>

        {/* Asistente de IA (botón flotante, solo personal) */}
        <AsistenteIA />
      </Box>
    </ThemeProvider>
  )
}

export default Layout
