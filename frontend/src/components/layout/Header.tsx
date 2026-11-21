import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'

import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded'

import {
  cerrarSesion,
  getNombreSesion,
  getRol,
  getUsuarioSesion,
  ROL_LABEL,
} from '../../services/api'

// Título que se muestra según la página actual
const TITULOS: Record<string, { titulo: string; subtitulo: string }> = {
  '/gestion/inicio': { titulo: 'Inicio', subtitulo: 'Resumen del día en la clínica' },
  '/gestion/pacientes': { titulo: 'Pacientes', subtitulo: 'Registro y datos de contacto' },
  '/gestion/agenda': { titulo: 'Agenda', subtitulo: 'Citas por día, odontólogo y sucursal' },
  '/gestion/horarios': { titulo: 'Horarios', subtitulo: 'Horario semanal y bloqueos de agenda' },
  '/gestion/ficha-clinica': { titulo: 'Ficha clínica', subtitulo: 'Antecedentes y atenciones' },
  '/gestion/presupuestos': { titulo: 'Presupuestos', subtitulo: 'Tratamientos, abonos y saldos' },
  '/gestion/usuarios': { titulo: 'Usuarios', subtitulo: 'Cuentas del personal y permisos' },
}

interface HeaderProps {
  onMenuClick: () => void
}

function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const rol = getRol()
  const nombre = getNombreSesion()
  const usuario = getUsuarioSesion()
  const inicial = nombre.charAt(0).toUpperCase()

  const ruta = Object.keys(TITULOS).find((clave) => location.pathname.startsWith(clave))
  const encabezado = ruta
    ? TITULOS[ruta]
    : { titulo: 'Gestión clínica', subtitulo: 'Clínica Más Dent' }

  const salir = () => {
    setAnchor(null)
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        backgroundColor: 'rgba(255,255,255,.86)',
        backdropFilter: 'blur(12px)',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 64, sm: 72 }, px: { xs: 2, sm: 3, lg: 4 }, gap: 1.5 }}>
        <IconButton
          onClick={onMenuClick}
          edge="start"
          aria-label="Abrir menú"
          sx={{ display: { xs: 'inline-flex', md: 'none' } }}
        >
          <MenuRoundedIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.2rem' }, lineHeight: 1.2 }} noWrap>
            {encabezado.titulo}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }} noWrap>
            {encabezado.subtitulo}
          </Typography>
        </Box>

        <ButtonBase
          onClick={(event) => setAnchor(event.currentTarget)}
          aria-label="Opciones de la cuenta"
          sx={{
            borderRadius: 999,
            pl: { xs: 0.5, sm: 1.5 },
            pr: 0.5,
            py: 0.5,
            gap: 1.25,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#fff',
            '&:hover': { borderColor: 'primary.light' },
          }}
        >
          <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', lineHeight: 1.2 }}>
              {nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {rol ? ROL_LABEL[rol] : 'Sin rol'}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: '0.9rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)',
            }}
          >
            {inicial}
          </Avatar>
          <KeyboardArrowDownRoundedIcon fontSize="small" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
        </ButtonBase>

        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 230, borderRadius: 3 } } }}
        >
          <Box sx={{ px: 2, py: 1.25 }}>
            <Typography sx={{ fontWeight: 700 }}>{nombre}</Typography>
            <Typography variant="body2" color="text.secondary">
              {usuario.username}
            </Typography>
            {usuario.correo && (
              <Typography variant="caption" color="text.secondary">
                {usuario.correo}
              </Typography>
            )}
          </Box>
          <Divider />
          <MenuItem onClick={salir} sx={{ color: 'error.main', py: 1.25 }}>
            <ListItemIcon sx={{ color: 'inherit' }}>
              <LogoutOutlinedIcon fontSize="small" />
            </ListItemIcon>
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Header
