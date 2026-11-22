import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { keyframes } from '@emotion/react'
import '@fontsource-variable/plus-jakarta-sans'

import {
  Accordion, AccordionDetails, AccordionSummary, AppBar, Box, Button, Card,
  Container, Divider, Drawer, Grid, IconButton, List, ListItemButton, ListItemText,
  Toolbar, Typography, useMediaQuery, useScrollTrigger,
} from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'
import type { SvgIconComponent } from '@mui/icons-material'

import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined'

/* =========================================================
   COLORES Y TEMA (solo afectan a esta página)
   Azul profundo + cian, en línea con el azul del login.
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
  tint: '#eef4ff',
  tintStrong: '#dbe7ff',
}

const GRADIENT = `linear-gradient(135deg, ${C.blue} 0%, ${C.cyan} 100%)`
const GRADIENT_TEXT = {
  background: `linear-gradient(90deg, ${C.blueLight}, ${C.cyan})`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
}

const theme = createTheme({
  palette: {
    primary: { main: C.blue, dark: C.blueDark, light: C.blueLight },
    secondary: { main: C.cyan },
    text: { primary: C.ink, secondary: C.muted },
    divider: C.line,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans Variable", system-ui, "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.05 },
    h2: { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15 },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    overline: { fontWeight: 700, letterSpacing: '0.16em' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 999 }, sizeLarge: { padding: '13px 28px', fontSize: '1rem' } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { border: `1px solid ${C.line}`, borderRadius: 20 } },
    },
    MuiAccordion: {
      defaultProps: { elevation: 0, disableGutters: true },
      styleOverrides: {
        root: {
          border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden',
          '&::before': { display: 'none' }, '&:not(:last-of-type)': { marginBottom: 12 },
          '&.Mui-expanded': { borderColor: C.tintStrong, boxShadow: '0 16px 40px -28px rgba(37,99,235,.45)' },
        },
      },
    },
  },
})

/* =========================================================
   CONTENIDO
   Basado solo en lo definido en el proyecto (documento de
   herramientas, base de datos y la página original).
========================================================= */

type Item = { icon: SvgIconComponent; title: string; text: string }

const NAV = [
  { id: 'servicios', label: 'Servicios' },
  { id: 'como-reservar', label: 'Cómo reservar' },
  { id: 'portal', label: 'Tu portal' },
  { id: 'preguntas', label: 'Preguntas' },
]

const TRUST: Item[] = [
  { icon: EventAvailableOutlinedIcon, title: 'Reserva online', text: 'Con o sin cuenta' },
  { icon: PlaceOutlinedIcon, title: '2 sucursales', text: 'Clínica Más Dent' },
  { icon: DevicesOutlinedIcon, title: 'Acceso 24/7', text: 'Desde cualquier dispositivo' },
  { icon: LockOutlinedIcon, title: 'Acceso seguro', text: 'Solo tú ves tu información' },
]

// Servicios de la página original
const SERVICIOS: Item[] = [
  { icon: HealthAndSafetyOutlinedIcon, title: 'Evaluación dental', text: 'Evaluaciones odontológicas para conocer tu estado de salud bucal.' },
  { icon: CleaningServicesOutlinedIcon, title: 'Limpieza dental', text: 'Mantén una adecuada higiene y prevención de enfermedades dentales.' },
  { icon: MedicalServicesOutlinedIcon, title: 'Tratamientos', text: 'Consulta y gestiona información relacionada con tus tratamientos.' },
]

const PASOS: Item[] = [
  { icon: TouchAppOutlinedIcon, title: 'Elige tu atención', text: 'Selecciona el servicio y la sucursal.' },
  { icon: CalendarMonthOutlinedIcon, title: 'Elige día y hora', text: 'Revisa los horarios disponibles.' },
  { icon: TaskAltOutlinedIcon, title: 'Confirma tu reserva', text: 'Ingresa tu RUT y tus datos de contacto.' },
]

// Lo que el paciente ve en su portal: horas, atenciones, presupuestos y pagos
const PORTAL: Item[] = [
  { icon: CalendarMonthOutlinedIcon, title: 'Mis horas', text: 'Revisa tus horas agendadas.' },
  { icon: HistoryOutlinedIcon, title: 'Mis atenciones', text: 'Consulta el historial de tus atenciones.' },
  { icon: ReceiptLongOutlinedIcon, title: 'Mis presupuestos', text: 'Revisa el detalle de tus presupuestos.' },
  { icon: PaymentsOutlinedIcon, title: 'Mis pagos', text: 'Paga y revisa tus pagos.' },
]

const COMPARATIVA: [string, boolean, boolean][] = [
  ['Reservar una hora', true, true],
  ['Ver tus horas agendadas', false, true],
  ['Historial de atenciones', false, true],
  ['Presupuestos', false, true],
  ['Pagos', false, true],
]

const PREGUNTAS = [
  ['¿Necesito una cuenta para reservar una hora?', 'No. Puedes reservar con tu RUT y tus datos de contacto. Con una cuenta, además puedes ver tus horas, atenciones, presupuestos y pagos.'],
  ['¿Cómo creo mi cuenta?', 'Desde "Crear cuenta". Si ya eres paciente de la clínica, usa tu RUT y la fecha de nacimiento que tienes registrada, así tu cuenta queda unida a tu historial.'],
  ['¿Qué puedo hacer en el portal del paciente?', 'Revisar tus horas agendadas, el historial de tus atenciones, tus presupuestos y tus pagos.'],
  ['¿Mis datos están protegidos?', 'Sí. El portal requiere iniciar sesión y cada paciente solo puede ver su propia información.'],
]

/* =========================================================
   ANIMACIONES Y UTILIDADES
========================================================= */

const float = keyframes`0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); }`
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(34,211,238,.6); }
  70% { box-shadow: 0 0 0 10px rgba(34,211,238,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,211,238,0); }
`
const glow = keyframes`0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: .8; transform: scale(1.08); }`

function scrollToId(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
}

/** Aparece con un fundido suave cuando entra en pantalla. */
function Reveal({ children, delay = 0, sx }: { children: ReactNode; delay?: number; sx?: SxProps<Theme> }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || reduce) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.15 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduce])

  const shown = visible || reduce
  return (
    <Box
      ref={ref}
      sx={[
        {
          opacity: shown ? 1 : 0,
          transform: shown ? 'none' : 'translateY(28px)',
          transition: `opacity .8s ease ${delay}ms, transform .8s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  )
}

/** Cuadro con un ícono dentro. */
function IconBadge({ icon: Icon, size = 52, className, dark = false }: { icon: SvgIconComponent; size?: number; className?: string; dark?: boolean }) {
  return (
    <Box
      className={className}
      sx={{
        width: size, height: size, flexShrink: 0, borderRadius: 3.5, display: 'grid', placeItems: 'center',
        bgcolor: dark ? 'rgba(255,255,255,.08)' : C.tint,
        color: dark ? C.cyan : 'primary.main',
        border: dark ? '1px solid rgba(255,255,255,.12)' : 'none',
        transition: 'background .3s, color .3s',
      }}
    >
      <Icon fontSize={size < 50 ? 'small' : 'medium'} />
    </Box>
  )
}

/** Bloque de página con fondo y espaciado comunes. */
function Section({ id, tone = '#ffffff', children }: { id?: string; tone?: string; children: ReactNode }) {
  return (
    <Box component="section" id={id} sx={{ py: { xs: 9, md: 13 }, bgcolor: tone, scrollMarginTop: 64 }}>
      <Container maxWidth="lg">{children}</Container>
    </Box>
  )
}

function SectionTitle({ overline, title, subtitle, left = false }: { overline: string; title: string; subtitle?: string; left?: boolean }) {
  return (
    <Reveal sx={{ textAlign: left ? 'left' : 'center', maxWidth: left ? 'none' : 680, mx: left ? 0 : 'auto', mb: { xs: 5, md: 7 } }}>
      <Typography
        variant="overline"
        sx={{ display: 'inline-block', color: 'primary.main', bgcolor: C.tint, px: 1.5, py: 0.25, borderRadius: 999 }}
      >
        {overline}
      </Typography>
      <Typography variant="h2" sx={{ mt: 2, fontSize: { xs: '2rem', md: '2.75rem' } }}>{title}</Typography>
      {subtitle && (
        <Typography sx={{ mt: 2, color: 'text.secondary', fontSize: '1.08rem', lineHeight: 1.7 }}>{subtitle}</Typography>
      )}
    </Reveal>
  )
}

function Logo({ dark = false, onClick }: { dark?: boolean; onClick?: () => void }) {
  return (
    <Box onClick={onClick} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: onClick ? 'pointer' : 'default' }}>
      <Box
        sx={{
          width: 40, height: 40, borderRadius: 3, display: 'grid', placeItems: 'center', color: '#fff',
          background: GRADIENT, boxShadow: '0 8px 24px -8px rgba(37,99,235,.7)',
        }}
      >
        <MedicalServicesOutlinedIcon sx={{ fontSize: 22 }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2, color: dark ? '#fff' : 'text.primary', transition: 'color .3s' }}>
          Más Dent
        </Typography>
        <Typography variant="caption" sx={{ color: dark ? 'rgba(255,255,255,.6)' : 'text.secondary', transition: 'color .3s' }}>
          Portal de pacientes · DentalSys
        </Typography>
      </Box>
    </Box>
  )
}

/* =========================================================
   PÁGINA
========================================================= */

function Home() {
  const navigate = useNavigate()

  const handleLogin = () => navigate('/login')
  // "Reservar" lleva a la reserva de hora (con o sin sesión)
  const handleReservar = () => navigate('/reservar')
  const handleRegistro = () => navigate('/registro')

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ color: 'text.primary', fontFamily: theme.typography.fontFamily }}>
        <Navbar onLogin={handleLogin} onReservar={handleReservar} onRegistro={handleRegistro} />
        <Box component="main">
          <Hero onLogin={handleLogin} onReservar={handleReservar} />
          <TrustBar />
          <Servicios />
          <ComoReservar />
          <PortalPaciente onLogin={handleLogin} onRegistro={handleRegistro} />
          <Preguntas />
          <LlamadoFinal onLogin={handleLogin} onReservar={handleReservar} />
        </Box>
        <Footer onLogin={handleLogin} onReservar={handleReservar} onRegistro={handleRegistro} />
      </Box>
    </ThemeProvider>
  )
}

type Actions = { onLogin: () => void; onReservar: () => void }

/* ---------- MENÚ SUPERIOR ---------- */

function Navbar({ onLogin, onReservar, onRegistro }: Actions & { onRegistro: () => void }) {
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 })
  const [open, setOpen] = useState(false)
  const onDark = !scrolled // arriba de todo el menú está sobre el hero oscuro

  const go = (id: string) => { setOpen(false); scrollToId(id) }

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          color: onDark ? '#fff' : 'text.primary',
          bgcolor: scrolled ? 'rgba(255,255,255,.88)' : 'transparent',
          backdropFilter: scrolled ? 'saturate(180%) blur(16px)' : 'none',
          borderBottom: `1px solid ${scrolled ? C.line : 'transparent'}`,
          transition: 'background-color .3s, border-color .3s, color .3s',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 76 }, gap: 2 }}>
            <Logo dark={onDark} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            <Box sx={{ flexGrow: 1 }} />

            <Box component="nav" sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
              {NAV.map((link) => (
                <Button
                  key={link.id}
                  onClick={() => go(link.id)}
                  sx={{
                    position: 'relative', color: onDark ? 'rgba(255,255,255,.75)' : 'text.secondary', fontWeight: 500, px: 1.75,
                    '&::after': {
                      content: '""', position: 'absolute', left: 14, right: 14, bottom: 6, height: 2, borderRadius: 1,
                      background: GRADIENT, transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform .25s',
                    },
                    '&:hover': { color: onDark ? '#fff' : 'text.primary', bgcolor: 'transparent' },
                    '&:hover::after': { transform: 'scaleX(1)' },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>

            <Button onClick={onLogin} sx={{ display: { xs: 'none', md: 'inline-flex' }, color: 'inherit' }}>
              Iniciar sesión
            </Button>
            <Button
              variant="contained"
              onClick={onReservar}
              sx={{ display: { xs: 'none', sm: 'inline-flex' }, px: 2.75, background: GRADIENT, boxShadow: '0 10px 24px -10px rgba(37,99,235,.8)' }}
            >
              Reservar hora
            </Button>
            <IconButton aria-label="Abrir menú" onClick={() => setOpen(true)} sx={{ display: { md: 'none' }, color: 'inherit' }}>
              <MenuRoundedIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Menú lateral para celular */}
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { sx: { width: 300, p: 2 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Logo />
          <IconButton aria-label="Cerrar menú" onClick={() => setOpen(false)}><CloseRoundedIcon /></IconButton>
        </Box>
        <List>
          {NAV.map((link) => (
            <ListItemButton key={link.id} onClick={() => go(link.id)} sx={{ borderRadius: 2 }}>
              <ListItemText primary={link.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Button variant="contained" size="large" onClick={onReservar} sx={{ background: GRADIENT }}>Reservar hora</Button>
          <Button variant="outlined" size="large" onClick={onLogin}>Iniciar sesión</Button>
          <Button size="large" onClick={onRegistro}>Crear cuenta de paciente</Button>
        </Box>
      </Drawer>
    </>
  )
}

/* ---------- HERO (fondo oscuro) ---------- */

function Hero({ onLogin, onReservar }: Actions) {
  return (
    <Box
      id="inicio"
      component="section"
      sx={{
        position: 'relative', overflow: 'hidden', color: '#fff',
        pt: { xs: 15, md: 22 }, pb: { xs: 12, md: 16 },
        background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navy2} 100%)`,
      }}
    >
      {/* Cuadrícula sutil de fondo */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 35%, #000 25%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 35%, #000 25%, transparent 75%)',
        }}
      />
      {/* Luces de color */}
      <Box aria-hidden sx={{ position: 'absolute', top: -160, right: -120, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,.55), transparent 65%)', filter: 'blur(20px)', animation: `${glow} 9s ease-in-out infinite` }} />
      <Box aria-hidden sx={{ position: 'absolute', bottom: -220, left: -160, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,.28), transparent 65%)', filter: 'blur(20px)', animation: `${glow} 11s ease-in-out 2s infinite` }} />

      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Grid container spacing={{ xs: 8, md: 6 }} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Reveal>
              <Box
                sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1.25, px: 1.75, py: 0.75, borderRadius: 999,
                  bgcolor: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)',
                  fontSize: '.875rem', fontWeight: 600, color: 'rgba(255,255,255,.85)',
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: C.cyan, animation: `${pulse} 2s infinite` }} />
                Clínica Más Dent · Reserva online
              </Box>
            </Reveal>

            <Reveal delay={100}>
              <Typography variant="h1" sx={{ mt: 3, fontSize: { xs: '2.6rem', sm: '3.4rem', md: '4.25rem' } }}>
                Tu salud dental,
                <Box component="span" sx={{ display: 'block', ...GRADIENT_TEXT }}>en buenas manos.</Box>
              </Typography>
            </Reveal>

            <Reveal delay={200}>
              <Typography sx={{ mt: 3, maxWidth: 520, color: 'rgba(255,255,255,.72)', fontSize: { xs: '1.05rem', md: '1.18rem' }, lineHeight: 1.75 }}>
                Reserva tu hora en Clínica Más Dent y revisa tus horas, atenciones,
                presupuestos y pagos desde tu portal de paciente.
              </Typography>
            </Reveal>

            <Reveal delay={300}>
              <Box sx={{ mt: 5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardRoundedIcon />}
                  onClick={onReservar}
                  sx={{
                    background: GRADIENT, boxShadow: '0 16px 36px -12px rgba(37,99,235,.9)',
                    '& .MuiButton-endIcon': { transition: 'transform .2s' },
                    '&:hover .MuiButton-endIcon': { transform: 'translateX(4px)' },
                  }}
                >
                  Reservar hora
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={onLogin}
                  sx={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,.06)' } }}
                >
                  Ya tengo cuenta
                </Button>
              </Box>
            </Reveal>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Reveal delay={250}><TarjetaPortal /></Reveal>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

/** Tarjeta de vidrio que resume lo que incluye el portal del paciente. */
function TarjetaPortal() {
  return (
    <Box sx={{ position: 'relative', maxWidth: 420, mx: 'auto' }}>
      <Box
        sx={{
          p: 3.5, borderRadius: 6,
          bgcolor: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)',
          backdropFilter: 'blur(18px)', boxShadow: '0 40px 80px -40px rgba(0,0,0,.6)',
          animation: `${float} 7s ease-in-out infinite`,
        }}
      >
        <Typography variant="overline" sx={{ color: C.cyan }}>Tu portal de paciente</Typography>
        <Typography variant="h6" sx={{ mt: 0.5, color: '#fff' }}>Todo en un solo lugar</Typography>

        <Box sx={{ mt: 3, display: 'grid', gap: 1.5 }}>
          {PORTAL.map(({ icon, title, text }) => (
            <Box
              key={title}
              sx={{
                display: 'flex', gap: 2, alignItems: 'center', p: 1.5, borderRadius: 3,
                bgcolor: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                transition: 'background-color .3s, border-color .3s',
                '&:hover': { bgcolor: 'rgba(255,255,255,.08)', borderColor: 'rgba(34,211,238,.35)' },
              }}
            >
              <IconBadge icon={icon} size={42} dark />
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{title}</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.6)' }}>{text}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Etiqueta flotante */}
      <Box
        sx={{
          position: 'absolute', left: { xs: 8, sm: -28 }, bottom: -22, display: 'flex', alignItems: 'center', gap: 1,
          px: 2, py: 1.25, borderRadius: 999, bgcolor: '#fff', color: C.ink,
          boxShadow: '0 20px 40px -16px rgba(0,0,0,.45)', animation: `${float} 7s ease-in-out 1.5s infinite`,
        }}
      >
        <LockOutlinedIcon sx={{ color: 'primary.main', fontSize: 18 }} />
        <Typography variant="body2" sx={{ fontWeight: 700 }}>Acceso seguro con tu cuenta</Typography>
      </Box>
    </Box>
  )
}

/* ---------- FRANJA DE BENEFICIOS ---------- */

function TrustBar() {
  return (
    <Box sx={{ borderBottom: `1px solid ${C.line}`, py: { xs: 4, md: 5 }, bgcolor: '#fff' }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {TRUST.map(({ icon, title, text }, i) => (
            <Grid key={title} size={{ xs: 6, md: 3 }}>
              <Reveal delay={i * 80}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                  <IconBadge icon={icon} size={44} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, lineHeight: 1.3 }}>{title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{text}</Typography>
                  </Box>
                </Box>
              </Reveal>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

/* ---------- SERVICIOS ---------- */

function Servicios() {
  return (
    <Section id="servicios">
      <SectionTitle
        overline="Nuestros servicios"
        title="Atención pensada para ti"
        subtitle="Accede a una gestión odontológica más ordenada, sencilla y transparente."
      />
      <Grid container spacing={3}>
        {SERVICIOS.map(({ icon, title, text }, i) => (
          <Grid key={title} size={{ xs: 12, md: 4 }}>
            <Reveal delay={i * 100} sx={{ height: '100%' }}>
              <Card
                sx={{
                  position: 'relative', overflow: 'hidden', height: '100%', p: 4,
                  transition: 'transform .35s, box-shadow .35s, border-color .35s',
                  // Barra de color que aparece arriba al pasar el mouse
                  '&::before': {
                    content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                    background: GRADIENT, transform: 'scaleX(0)', transformOrigin: 'left', transition: 'transform .35s',
                  },
                  '&:hover': { transform: 'translateY(-8px)', borderColor: C.tintStrong, boxShadow: '0 30px 60px -30px rgba(37,99,235,.35)' },
                  '&:hover::before': { transform: 'scaleX(1)' },
                  '&:hover .badge': { background: GRADIENT, color: '#fff' },
                }}
              >
                <IconBadge icon={icon} className="badge" />
                <Typography variant="h6" sx={{ mt: 3 }}>{title}</Typography>
                <Typography sx={{ mt: 1.25, color: 'text.secondary', lineHeight: 1.7 }}>{text}</Typography>
              </Card>
            </Reveal>
          </Grid>
        ))}
      </Grid>
    </Section>
  )
}

/* ---------- CÓMO RESERVAR ---------- */

function ComoReservar() {
  return (
    <Section id="como-reservar" tone={C.surface}>
      <SectionTitle
        overline="Cómo reservar"
        title="Tu hora lista en tres pasos"
        subtitle="No necesitas crear una cuenta para reservar."
      />
      <Grid container spacing={{ xs: 5, md: 4 }}>
        {PASOS.map(({ icon: Icon, title, text }, i) => (
          <Grid key={title} size={{ xs: 12, md: 4 }}>
            <Reveal delay={i * 120}>
              <Box
                sx={{
                  position: 'relative', textAlign: 'center', px: 2,
                  // Línea entre pasos (solo escritorio)
                  '&::after': i === PASOS.length - 1 ? undefined : {
                    content: '""', display: { xs: 'none', md: 'block' }, position: 'absolute', top: 38, height: 2,
                    left: 'calc(50% + 56px)', right: 'calc(-50% + 56px)',
                    background: `linear-gradient(90deg, ${C.tintStrong}, ${C.blueLight}, ${C.tintStrong})`,
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'relative', width: 76, height: 76, mx: 'auto', borderRadius: '50%', display: 'grid', placeItems: 'center',
                    bgcolor: '#fff', color: 'primary.main', border: `1px solid ${C.line}`, boxShadow: '0 18px 36px -20px rgba(37,99,235,.55)',
                  }}
                >
                  <Icon sx={{ fontSize: 30 }} />
                  <Box
                    sx={{
                      position: 'absolute', top: -4, right: -4, width: 28, height: 28, borderRadius: '50%', display: 'grid',
                      placeItems: 'center', background: GRADIENT, color: '#fff', fontSize: '.8rem', fontWeight: 800,
                      boxShadow: '0 6px 14px -4px rgba(37,99,235,.6)',
                    }}
                  >
                    {i + 1}
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ mt: 3 }}>{title}</Typography>
                <Typography sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.7 }}>{text}</Typography>
              </Box>
            </Reveal>
          </Grid>
        ))}
      </Grid>
    </Section>
  )
}

/* ---------- PORTAL DEL PACIENTE ---------- */

function PortalPaciente({ onLogin, onRegistro }: { onLogin: () => void; onRegistro: () => void }) {
  return (
    <Section id="portal">
      <Grid container spacing={{ xs: 6, md: 8 }} sx={{ alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <SectionTitle
            left
            overline="Portal del paciente"
            title="¿Con o sin cuenta?"
            subtitle="Puedes reservar sin registrarte. Con tu cuenta, además sigues tus horas, atenciones, presupuestos y pagos."
          />
          <Reveal delay={150}>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="contained" size="large" onClick={onLogin} sx={{ background: GRADIENT, boxShadow: '0 16px 36px -14px rgba(37,99,235,.8)' }}>
                Ingresar a mi portal
              </Button>
              <Button variant="outlined" size="large" onClick={onRegistro}>
                Crear mi cuenta
              </Button>
            </Box>
          </Reveal>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Reveal delay={150}>
            <Card sx={{ p: { xs: 3, md: 4 }, boxShadow: '0 40px 80px -50px rgba(11,18,32,.45)' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 96px 96px', alignItems: 'end', pb: 2, borderBottom: `1px solid ${C.line}` }}>
                <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>Funciones</Typography>
                <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary' }}>Sin cuenta</Typography>
                <Typography
                  variant="body2"
                    sx={{ justifySelf: 'center', fontWeight: 700, color: '#fff', background: GRADIENT, px: 1.5, py: 0.5, borderRadius: 999, whiteSpace: 'nowrap' }}
                >
                  Con cuenta
                </Typography>
              </Box>
              {COMPARATIVA.map(([label, sin, con]) => (
                <Box
                  key={label}
                  sx={{
                    display: 'grid', gridTemplateColumns: '1fr 96px 96px', alignItems: 'center', py: 2,
                    borderBottom: `1px solid ${C.line}`, '&:last-of-type': { borderBottom: 'none', pb: 0 },
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>{label}</Typography>
                  {[sin, con].map((ok, j) => (
                    <Box key={j} sx={{ display: 'grid', placeItems: 'center' }}>
                      {ok
                        ? <CheckCircleRoundedIcon sx={{ color: 'primary.main' }} aria-label="Incluido" />
                        : <RemoveRoundedIcon sx={{ color: '#c4cbd8' }} aria-label="No incluido" />}
                    </Box>
                  ))}
                </Box>
              ))}
            </Card>
          </Reveal>
        </Grid>
      </Grid>
    </Section>
  )
}

/* ---------- PREGUNTAS FRECUENTES ---------- */

function Preguntas() {
  const [abierta, setAbierta] = useState<number | false>(0)

  return (
    <Section id="preguntas" tone={C.surface}>
      <SectionTitle overline="Preguntas frecuentes" title="Resolvemos tus dudas" />
      <Box sx={{ maxWidth: 780, mx: 'auto' }}>
        {PREGUNTAS.map(([pregunta, respuesta], i) => (
          <Reveal key={pregunta} delay={i * 80}>
            <Accordion expanded={abierta === i} onChange={(_, isOpen) => setAbierta(isOpen ? i : false)}>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 3, py: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>{pregunta}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                <Typography sx={{ color: 'text.secondary', lineHeight: 1.75 }}>{respuesta}</Typography>
              </AccordionDetails>
            </Accordion>
          </Reveal>
        ))}
      </Box>
    </Section>
  )
}

/* ---------- LLAMADO FINAL ---------- */

function LlamadoFinal({ onLogin, onReservar }: Actions) {
  return (
    <Section>
      <Reveal>
        <Box
          sx={{
            position: 'relative', overflow: 'hidden', borderRadius: 7, px: { xs: 3, md: 8 }, py: { xs: 8, md: 10 },
            textAlign: 'center', color: '#fff', background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navy2} 60%, ${C.blueDark} 100%)`,
          }}
        >
          <Box aria-hidden sx={{ position: 'absolute', top: -140, right: -100, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,.35), transparent 65%)', animation: `${glow} 9s ease-in-out infinite` }} />
          <Box aria-hidden sx={{ position: 'absolute', bottom: -160, left: -80, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,.45), transparent 65%)', animation: `${glow} 11s ease-in-out 2s infinite` }} />

          <Typography variant="h2" sx={{ position: 'relative', fontSize: { xs: '2rem', md: '3rem' } }}>
            ¿Agendamos tu <Box component="span" sx={GRADIENT_TEXT}>próxima atención</Box>?
          </Typography>
          <Typography sx={{ position: 'relative', mt: 2, mx: 'auto', maxWidth: 520, color: 'rgba(255,255,255,.72)', fontSize: '1.1rem' }}>
            Reserva tu hora en pocos pasos.
          </Typography>
          <Box sx={{ position: 'relative', mt: 5, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button size="large" variant="contained" onClick={onReservar} sx={{ background: GRADIENT, boxShadow: '0 16px 36px -12px rgba(34,211,238,.6)' }}>
              Reservar hora
            </Button>
            <Button
              size="large"
              variant="outlined"
              onClick={onLogin}
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,.3)', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,.06)' } }}
            >
              Iniciar sesión
            </Button>
          </Box>
        </Box>
      </Reveal>
    </Section>
  )
}

/* ---------- FOOTER ---------- */

function Footer({ onLogin, onReservar, onRegistro }: Actions & { onRegistro: () => void }) {
  const linkSx = {
    justifyContent: 'flex-start', color: 'rgba(255,255,255,.65)', px: 0, py: 0.5, minWidth: 0, fontWeight: 400,
    '&:hover': { color: '#fff', bgcolor: 'transparent' },
  }
  const columnas: [string, [string, () => void][]][] = [
    ['Clínica', NAV.map((l) => [l.label, () => scrollToId(l.id)] as [string, () => void])],
    ['Pacientes', [['Reservar hora', onReservar], ['Iniciar sesión', onLogin], ['Crear cuenta', onRegistro]]],
  ]

  return (
    <Box component="footer" sx={{ bgcolor: C.navy, color: '#fff', pt: 9, pb: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Logo dark />
            <Typography sx={{ mt: 2.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.7, maxWidth: 380 }}>
              Sistema web de gestión odontológica para Clínica Más Dent.
            </Typography>
          </Grid>

          {columnas.map(([titulo, links]) => (
            <Grid key={titulo} size={{ xs: 6, md: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{titulo}</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {links.map(([label, onClick]) => (
                  <Button key={label} onClick={onClick} sx={linkSx}>{label}</Button>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,.1)' }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.45)', textAlign: 'center' }}>
          © {new Date().getFullYear()} Clínica Más Dent · Plataforma DentalSys
        </Typography>
      </Container>
    </Box>
  )
}

export default Home