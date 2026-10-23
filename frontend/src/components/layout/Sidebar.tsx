import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMediaQuery, useTheme } from '@mui/material'

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import PeopleIcon from '@mui/icons-material/People'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

const drawerWidth = 250

const menuItems = [
  {
    label: 'Inicio',
    path: '/gestion/inicio',
    icon: <HomeOutlinedIcon />,
  },
  {
    label: 'Pacientes',
    path: '/gestion/pacientes',
    icon: <PeopleIcon />,
  },
  {
    label: 'Agenda',
    path: '/gestion/agenda',
    icon: <CalendarMonthOutlinedIcon />,
  },
  {
    label: 'Ficha Clínica',
    path: '/gestion/ficha-clinica',
    icon: <DescriptionOutlinedIcon />,
  },
  {
    label: 'Presupuestos',
    path: '/gestion/presupuestos',
    icon: <RequestQuoteOutlinedIcon />,
  },
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
          py: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#EEF5FF',
              color: '#2563EB',
            }}
          >
            <MedicalServicesOutlinedIcon />
          </Box>

          <Box>
            <Typography
              sx={{
                color: '#1F2937',
                fontWeight: 800,
                fontSize: '1.15rem',
                lineHeight: 1.2,
              }}
            >
              DentalSys
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: '#6B7280',
              }}
            >
              Gestión Clínica Dental
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ px: 1.5, py: 2 }}>
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            color: '#9CA3AF',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Menú principal
        </Typography>
      </Box>

      <List sx={{ px: 1.5, pt: 0 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path

          return (
            <ListItem
              key={item.path}
              disablePadding
              sx={{ mb: 0.7 }}
            >
              <ListItemButton
                selected={isSelected}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  minHeight: 46,
                  px: 1.5,
                  borderRadius: 2,
                  color: isSelected ? '#2563EB' : '#4B5563',

                  '&.Mui-selected': {
                    backgroundColor: '#EEF5FF',
                    color: '#2563EB',
                    fontWeight: 600,

                    '&:hover': {
                      backgroundColor: '#E5EFFF',
                    },
                  },

                  '&:hover': {
                    backgroundColor: '#F9FAFB',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.92rem',
                      fontWeight: isSelected ? 600 : 500,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            minHeight: 46,
            px: 1.5,
            borderRadius: 2,
            color: '#6B7280',

            '&:hover': {
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 38,
              color: 'inherit',
            }}
          >
            <LogoutOutlinedIcon />
          </ListItemIcon>

          <ListItemText
            primary="Cerrar sesión"
            sx={{
              '& .MuiListItemText-primary': {
                fontSize: '0.92rem',
                fontWeight: 500,
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