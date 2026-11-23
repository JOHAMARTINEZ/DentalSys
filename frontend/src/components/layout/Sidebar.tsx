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
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import MedicalInformationOutlinedIcon from '@mui/icons-material/MedicalInformationOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'

import { cerrarSesion, getRol, ROL_LABEL } from '../../services/api'
import type { Rol } from '../../services/api'
import { temaDeRol } from './temaRol'

/* =========================================================
   MENÚ LATERAL DEL PORTAL DE GESTIÓN
   Cada opción indica qué roles la ven (las mismas reglas
   que usa App.tsx para proteger las rutas).
========================================================= */

const SIDEBAR_WIDTH = 264

const C = {
  navy: '#0a1628',
  navy2: '#10264a',
}

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
    label: 'Horarios',
    path: '/gestion/horarios',
    icon: <ScheduleOutlinedIcon />,
    roles: ['ADMIN', 'RECEPCIONISTA', 'ODONTOLOGO'],
  },
  {
    label: 'Ficha clínica',
    path: '/gestion/ficha-clinica',
    icon: <DescriptionOutlinedIcon />,
    roles: ['ODONTOLOGO'],
  },
  {
    label: 'Tratamientos',
    path: '/gestion/tratamientos',
    icon: <MedicalInformationOutlinedIcon />,
    roles: ['ADMIN', 'ODONTOLOGO'],
  },
  {
    label: 'Presupuestos',
    path: '/gestion/presupuestos',
    icon: <RequestQuoteOutlinedIcon />,
    roles: ['ODONTOLOGO', 'RECEPCIONISTA'],
  },
  {
    label: 'Pagos',
    path: '/gestion/pagos',
    icon: <PaymentsOutlinedIcon />,
    roles: ['ADMIN', 'RECEPCIONISTA'],
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
  const tema = temaDeRol(rol)
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
            background: tema.gradiente,
            boxShadow: `0 10px 24px -10px ${tema.sombra}`,
          }}
        >
          <MedicalServicesOutlinedIcon sx={{ color: '#fff' }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.12rem', lineHeight: 1.15 }}>
            Más Dent
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.6)' }}>
            DentalSys · Gestión
          </Typography>
        </Box>
      </Box>

      {/* Espacio de trabajo del rol */}
      {rol && (
        <Box
          sx={{
            mx: 1.5,
            mb: 2.5,
            p: 1.5,
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.08)',
          }}
        >
          <Box
            aria-hidden
            sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: tema.gradiente }}
          />
          <Typography
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: tema.light,
            }}
          >
            {ROL_LABEL[rol]}
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3 }}>
            {tema.espacio}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.55)', lineHeight: 1.3, display: 'block' }}>
            {tema.lema}
          </Typography>
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
                background: activo ? 'rgba(255,255,255,.10)' : 'transparent',
                boxShadow: activo ? `inset 3px 0 0 ${tema.light}` : 'none',
                transition: 'background-color .2s, color .2s',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,.08)',
                  color: '#fff',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: activo ? tema.light : 'inherit', transition: 'color .2s' }}>
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
