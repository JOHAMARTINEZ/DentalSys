import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'

import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import AddRoundedIcon from '@mui/icons-material/AddRounded'

import { cerrarSesion, getUsuarioSesion } from '../../services/api'

/* =========================================================
   DISEÑO DEL PORTAL DEL PACIENTE
   Barra superior azul marino (como la página pública),
   encabezado con el título de la sección y el contenido
   de cada página debajo.
========================================================= */

const C = {
  navy: '#0a1628',
  navy2: '#10264a',
  blue: '#2563eb',
  blueDark: '#1d4ed8',
  blueLight: '#60a5fa',
  cyan: '#22d3ee',
  ink: '#0b1220',
  muted: '#526077',
  line: '#e6eaf2',
  surface: '#f5f7fb',
}

const GRADIENT = `linear-gradient(135deg, ${C.blue} 0%, ${C.cyan} 100%)`

const theme = createTheme({
  palette: {
    primary: { main: C.blue, dark: C.blueDark, light: C.blueLight },
    secondary: { main: C.cyan },
    text: { primary: C.ink, secondary: C.muted },
    divider: C.line,
    background: { default: C.surface, paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans Variable", system-ui, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05 },
    h5: { fontWeight: 800, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    overline: { fontWeight: 700, letterSpacing: '0.16em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          transition: 'transform .15s ease, box-shadow .2s ease, filter .2s ease',
          '&.MuiButton-contained:not(.Mui-disabled):hover': { transform: 'translateY(-1px)', filter: 'brightness(1.04)' },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${C.line}`, borderRadius: 20 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 20, animation: 'md-dialogo .28s cubic-bezier(.2,.8,.2,1)' } },
    },
    MuiTextField: {
      defaultProps: { size: 'small', fullWidth: true },
    },
  },
})

const MENU = [
  { label: 'Inicio', path: '/portal', icono: <HomeOutlinedIcon /> },
  { label: 'Mis citas', path: '/portal/citas', icono: <CalendarMonthOutlinedIcon /> },
  { label: 'Atenciones', path: '/portal/atenciones', icono: <HistoryOutlinedIcon /> },
  { label: 'Presupuestos', path: '/portal/presupuestos', icono: <RequestQuoteOutlinedIcon /> },
  { label: 'Pagos', path: '/portal/pagos', icono: <PaymentsOutlinedIcon /> },
  { label: 'Mi perfil', path: '/portal/perfil', icono: <PersonOutlineRoundedIcon /> },
]

const TITULOS: Record<string, { sobre: string; titulo: string; texto: string }> = {
  '/portal': { sobre: 'Tu portal', titulo: 'Hola', texto: 'Aquí tienes un resumen de tus horas, atenciones y pagos.' },
  '/portal/citas': { sobre: 'Mis horas', titulo: 'Mis citas', texto: 'Revisa tus próximas horas y el historial de tus visitas.' },
  '/portal/atenciones': { sobre: 'Mi historial', titulo: 'Mis atenciones', texto: 'Diagnósticos, indicaciones y tratamientos de tus atenciones.' },
  '/portal/presupuestos': { sobre: 'Mis tratamientos', titulo: 'Mis presupuestos', texto: 'Revisa, acepta o rechaza los presupuestos de tu odontólogo.' },
  '/portal/pagos': { sobre: 'Mis pagos', titulo: 'Pagos y comprobantes', texto: 'Tus saldos pendientes, pagos realizados y comprobantes.' },
  '/portal/perfil': { sobre: 'Mi cuenta', titulo: 'Mi perfil', texto: 'Tus datos de contacto, contraseña y notificaciones.' },
}

function PortalLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const usuario = getUsuarioSesion()
  const [menuMovil, setMenuMovil] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const ruta = location.pathname.replace(/\/$/, '') || '/portal'
  const encabezado = TITULOS[ruta] ?? TITULOS['/portal']
  const titulo = ruta === '/portal' ? `Hola, ${usuario.nombres || 'paciente'}` : encabezado.titulo
  const inicial = (usuario.nombres || usuario.username || 'P').charAt(0).toUpperCase()

  const salir = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  const ir = (path: string) => {
    setMenuMovil(false)
    setAnchor(null)
    navigate(path)
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', bgcolor: C.surface, fontFamily: theme.typography.fontFamily }}>
        {/* ===== Encabezado ===== */}
        <Box sx={{ position: 'relative', overflow: 'hidden', color: '#fff', pb: { xs: 11, md: 13 }, background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navy2} 100%)` }}>
          <Box aria-hidden sx={{ position: 'absolute', top: -160, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,.5), transparent 65%)', filter: 'blur(20px)' }} />
          <Box aria-hidden sx={{ position: 'absolute', bottom: -220, left: -140, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,.22), transparent 65%)', filter: 'blur(20px)' }} />

          <Container maxWidth="lg" sx={{ position: 'relative' }}>
            {/* Barra */}
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', py: 2.5, gap: 2 }}>
              <Box onClick={() => ir('/portal')} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 3, display: 'grid', placeItems: 'center', background: GRADIENT, boxShadow: '0 8px 24px -8px rgba(37,99,235,.7)' }}>
                  <MedicalServicesOutlinedIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>Más Dent</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.6)' }}>Portal de pacientes · DentalSys</Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
                {MENU.filter((m) => m.path !== '/portal/perfil').map((m) => {
                  const activo = ruta === m.path
                  return (
                    <Button
                      key={m.path}
                      onClick={() => ir(m.path)}
                      sx={{
                        color: activo ? '#fff' : 'rgba(255,255,255,.72)',
                        bgcolor: activo ? 'rgba(255,255,255,.1)' : 'transparent',
                        px: 1.75,
                        '&:hover': { bgcolor: 'rgba(255,255,255,.08)', color: '#fff' },
                      }}
                    >
                      {m.label}
                    </Button>
                  )
                })}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <ButtonBase onClick={(e) => setAnchor(e.currentTarget)} sx={{ borderRadius: 999, display: { xs: 'none', md: 'flex' } }} aria-label="Opciones de la cuenta">
                  <Avatar sx={{ width: 38, height: 38, fontWeight: 800, background: GRADIENT }}>{inicial}</Avatar>
                </ButtonBase>
                <IconButton onClick={() => setMenuMovil(true)} sx={{ color: '#fff', display: { md: 'none' } }} aria-label="Abrir menú">
                  <MenuRoundedIcon />
                </IconButton>
              </Stack>
            </Stack>

            {/* Título de la sección */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, mt: { xs: 3, md: 5 } }}>
              <Box>
                <Typography variant="overline" sx={{ color: C.cyan }}>{encabezado.sobre}</Typography>
                <Typography variant="h1" sx={{ mt: 0.5, fontSize: { xs: '2rem', md: '2.7rem' } }}>{titulo}</Typography>
                <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.72)', maxWidth: 560 }}>{encabezado.texto}</Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddRoundedIcon />}
                onClick={() => navigate('/portal/reservar-cita')}
                sx={{ background: GRADIENT, boxShadow: '0 16px 36px -14px rgba(37,99,235,.8)', alignSelf: { xs: 'flex-start', sm: 'flex-end' }, whiteSpace: 'nowrap' }}
              >
                Reservar hora
              </Button>
            </Stack>
          </Container>
        </Box>

        {/* ===== Contenido ===== */}
        <Container maxWidth="lg" sx={{ position: 'relative', mt: { xs: -8, md: -9 }, pb: 10 }}>
          {/* key: al cambiar de sección se repite la animación de entrada */}
          <Box key={ruta} sx={{ animation: 'md-aparecer .35s cubic-bezier(.2,.8,.2,1)' }}>
            <Outlet />
          </Box>
        </Container>

        {/* Menú de la cuenta (escritorio) */}
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 220, borderRadius: 3 } } }}
        >
          <Box sx={{ px: 2, py: 1.25 }}>
            <Typography sx={{ fontWeight: 700 }}>{[usuario.nombres, usuario.apellidos].filter(Boolean).join(' ') || usuario.username}</Typography>
            <Typography variant="body2" color="text.secondary">{usuario.correo}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => ir('/portal/perfil')}>
            <ListItemIcon><PersonOutlineRoundedIcon fontSize="small" /></ListItemIcon>
            Mi perfil
          </MenuItem>
          <MenuItem onClick={salir} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'inherit' }}><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>
            Cerrar sesión
          </MenuItem>
        </Menu>

        {/* Menú móvil */}
        <Drawer anchor="right" open={menuMovil} onClose={() => setMenuMovil(false)} slotProps={{ paper: { sx: { width: 280 } } }}>
          <Box sx={{ p: 2.5 }}>
            <Typography sx={{ fontWeight: 800 }}>{[usuario.nombres, usuario.apellidos].filter(Boolean).join(' ') || usuario.username}</Typography>
            <Typography variant="body2" color="text.secondary">Portal de pacientes</Typography>
          </Box>
          <Divider />
          <List sx={{ px: 1 }}>
            {MENU.map((m) => (
              <ListItemButton key={m.path} selected={ruta === m.path} onClick={() => ir(m.path)} sx={{ borderRadius: 2 }}>
                <ListItemIcon>{m.icono}</ListItemIcon>
                <ListItemText primary={m.label} />
              </ListItemButton>
            ))}
          </List>
          <Divider />
          <List sx={{ px: 1 }}>
            <ListItemButton onClick={salir} sx={{ borderRadius: 2, color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'inherit' }}><LogoutOutlinedIcon /></ListItemIcon>
              <ListItemText primary="Cerrar sesión" />
            </ListItemButton>
          </List>
        </Drawer>
      </Box>
    </ThemeProvider>
  )
}

export default PortalLayout
