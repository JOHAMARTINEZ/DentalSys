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

const drawerWidth = 220

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

  const handleLogout = () => {
    localStorage.removeItem('dentalsys_token')
    localStorage.removeItem('dentalsys_username')
    navigate('/login')
  }

  const drawerContent = (
    <>
      <Box
        sx={{
          px: 2.5,
          py: 2.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#1F2937',
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          DentalSys
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Gestión Clínica Dental
        </Typography>
      </Box>

      <Divider />

      <List
        sx={{
          px: 1,
          py: 2,
        }}
      >
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path

          return (
            <ListItem
              key={item.path}
              disablePadding
              sx={{ mb: 0.5 }}
            >
              <ListItemButton
                selected={isSelected}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 1.5,
                  minHeight: 42,
                  '&.Mui-selected': {
                    backgroundColor: '#EEF5FF',
                    color: '#2563EB',
                    '&:hover': {
                      backgroundColor: '#E5EFFF',
                    },
                  },
                  '&:hover': {
                    backgroundColor: '#F9FAFB',
                  },
                }}
              >
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.9rem',
                      fontWeight: isSelected ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Box
        sx={{
          mt: 'auto',
          p: 1,
        }}
      >
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1.5,
            minHeight: 42,
            '&:hover': {
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
            },
          }}
        >
          <ListItemText
            primary="Cerrar sesión"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.9rem',
              },
            }}
          />
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
        width: isMobile ? 280 : drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isMobile ? 280 : drawerWidth,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default Sidebar