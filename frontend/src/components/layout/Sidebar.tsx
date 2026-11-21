import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { useMediaQuery, useTheme } from '@mui/material'

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'

import { cerrarSesion, getRol, ROL_LABEL } from '../../services/api'
import type { Rol } from '../../services/api'

/* =========================================================
   MENÚ LATERAL DEL PORTAL DE GESTIÓN
   Cada opción indica qué roles la ven (las mismas reglas
   que usa App.tsx para proteger las rutas).
========================================================= */

const SIDEBAR_WIDTH = 264

const C = {
  navy: '#0a1628',
  navy2: '#10264a',
  blueLight: '#60a5fa',
  cyan: '#22d3ee',
}

const GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)'

interface MenuItem {
  label: string
  path: string
  icon: ReactNode
  roles: Rol[]
}

const MENU: MenuItem[] = [
  {
    label: 'Inicio',
    path: '/gestion/inicio',
    icon: <HomeOutlinedIcon />,
    roles: ['ADMIN', 'RECEPCIONISTA', 'ODONTOLOGO'],
  },
  {
    label: 'Pacientes',
    path: '/gestion/pacientes',
    icon: <PeopleAltOutlinedIcon />,
    roles: ['ADMIN', 'RECEPCIONISTA', 'ODONTOLOGO'],
  },
  {
    label: 'Agenda',
    path: '/gestion/agenda',
    icon: <CalendarMonthOutlinedIcon />,
    roles: ['ADMIN', 'RECEPCIONISTA', 'ODONTOLOGO'],
  },
  {
    label: 'Ficha clínica',
    path: '/gestion/ficha-clinica',
    icon: <DescriptionOutlinedIcon />,
    roles: ['ODONTOLOGO'],
  },
  {
    label: 'Presupuestos',
    path: '/gestion/presupuestos',
    icon: <RequestQuoteOutlinedIcon />,
    roles: ['ODONTOLOGO', 'RECEPCIONISTA'],
  },
  {
    label: 'Usuarios',
    path: '/gestion/usuarios',
    icon: <ManageAccountsOutlinedIcon />,
    roles: ['ADMIN'],
  },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const rol = getRol()
  const opciones = MENU.filter((item) => rol !== null && item.roles.includes(rol))

  const irA = (path: string) => {
    navigate(path)
    if (isMobile) {
      onClose()
    }
  }

  const salir = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  const contenido = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(180deg, ${C.navy} 0%, ${C.navy2} 100%)`,
        color: '#fff',
      }}
    >
      {/* Marca */}
      <Box
        onClick={() => irA('/gestion/inicio')}
        sx={{ px: 2.5, pt: 3, pb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 3,
            display: 'grid',
            placeItems: 'center',
            background: GRADIENT,
            boxShadow: '0 10px 24px -10px rgba(34,211,238,.7)',
          }}
        >
          <MedicalServicesOutlinedIcon sx={{ color: '#fff' }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.12rem', lineHeight: 1.15 }}>
            Más Dent
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.6)' }}>
            Gestión · DentalSys
          </Typography>
        </Box>
      </Box>

      {rol && (
        <Box sx={{ px: 2.5, pb: 2 }}>
          <Box
            sx={{
              display: 'inline-flex',
              px: 1.25,
              py: 0.4,
              borderRadius: 999,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: C.cyan,
              backgroundColor: 'rgba(34,211,238,.12)',
              border: '1px solid rgba(34,211,238,.25)',
            }}
          >
            {ROL_LABEL[rol]}
          </Box>
        </Box>
      )}

      <Typography
        variant="caption"
        sx={{
          px: 3,
          pb: 1,
          color: 'rgba(255,255,255,.45)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        Menú
      </Typography>

      <List sx={{ px: 1.5, pt: 0 }}>
        {opciones.map((item) => {
          const activo = location.pathname.startsWith(item.path)

          return (
            <ListItemButton
              key={item.path}
              onClick={() => irA(item.path)}
              sx={{
                minHeight: 46,
                mb: 0.5,
                px: 1.5,
                borderRadius: 2.5,
                color: activo ? '#fff' : 'rgba(255,255,255,.72)',
                background: activo ? 'rgba(96,165,250,.16)' : 'transparent',
                boxShadow: activo ? 'inset 3px 0 0 #22d3ee' : 'none',
                transition: 'background-color .2s, color .2s',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,.08)',
                  color: '#fff',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: activo ? C.cyan : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: { sx: { fontSize: '0.92rem', fontWeight: activo ? 700 : 500 } },
                }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <ListItemButton
          onClick={salir}
          sx={{
            minHeight: 46,
            px: 1.5,
            borderRadius: 2.5,
            color: 'rgba(255,255,255,.72)',
            '&:hover': { backgroundColor: 'rgba(248,113,113,.12)', color: '#fca5a5' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
            <LogoutOutlinedIcon />
          </ListItemIcon>
          <ListItemText
            primary="Cerrar sesión"
            slotProps={{ primary: { sx: { fontSize: '0.92rem', fontWeight: 500 } } }}
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: isMobile ? 0 : SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
        },
      }}
    >
      {contenido}
    </Drawer>
  )
}

export default Sidebar
