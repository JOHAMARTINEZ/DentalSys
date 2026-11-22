import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'

import Box from '@mui/material/Box'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import Sidebar from './Sidebar'
import Header from './Header'
import AsistenteIA from '../AsistenteIA'

/* =========================================================
   TEMA DEL PORTAL DE GESTIÓN
   Mismos colores que la página pública (azul profundo + cian)
   para que todo el sistema se vea coherente.
========================================================= */

// Debe coincidir con el ancho definido en Sidebar.tsx
const SIDEBAR_WIDTH = 264

const C = {
  navy: '#0a1628',
  blue: '#2563eb',
  blueDark: '#1d4ed8',
  blueLight: '#60a5fa',
  cyan: '#22d3ee',
  ink: '#0b1220',
  muted: '#526077',
  line: '#e6eaf2',
  surface: '#f5f7fb',
}

const theme = createTheme({
  palette: {
    primary: { main: C.blue, dark: C.blueDark, light: C.blueLight },
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
      styleOverrides: { root: { borderRadius: 999, paddingLeft: 18, paddingRight: 18 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${C.line}`, borderRadius: 18 } },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 18 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 20 } },
    },
    MuiTextField: {
      defaultProps: { size: 'small', fullWidth: true },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
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

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <ThemeProvider theme={theme}>
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

          <Box
            sx={{
              px: { xs: 2, sm: 3, lg: 4 },
              py: { xs: 2.5, sm: 3.5 },
              maxWidth: 1440,
              mx: 'auto',
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
