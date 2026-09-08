import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMediaQuery, useTheme } from '@mui/material'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

const menuItems = [
  { label: 'Inicio', path: '/inicio' },
  { label: 'Pacientes', path: '/pacientes' },
  { label: 'Agenda', path: '/agenda' },
  { label: 'Ficha Clínica', path: '/ficha-clinica' },
  { label: 'Presupuestos', path: '/presupuestos' },
]

function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleNavigation = (path: string) => {
    navigate(path)

    if (isMobile) {
      onClose()
    }
  }

  const drawerContent = (
    <>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          DentalSys
        </Typography>

        <Typography variant="body2">
          Gestión Clínica Dental
        </Typography>
      </Box>

      <Divider />

      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                mb: 0.5,
                borderRadius: 1,
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 'auto', p: 1 }}>
        <ListItemButton
          sx={{
            mb: 0.5,
            borderRadius: 1,
          }}
        >
          <ListItemText primary="Administración" />
        </ListItemButton>

        <ListItemButton
          sx={{
            borderRadius: 1,
          }}
        >
          <ListItemText primary="Cerrar sesión" />
        </ListItemButton>
      </Box>
    </>
  )

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        width: { xs: 200, sm: 240 },
        '& .MuiDrawer-paper': {
          width: { xs: 200, sm: 240 },
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default Sidebar