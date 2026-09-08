import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

const menuItems = [
  'Inicio',
  'Pacientes',
  'Agenda',
  'Ficha Clínica',
  'Presupuestos',
]

function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          DentalSys
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Gestión Clínica Dental
        </Typography>
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 2 }}>
        {menuItems.map((item, index) => (
          <ListItemButton
            key={item}
            selected={index === 0}
            sx={{
              mb: 0.5,
              borderRadius: 1,
            }}
          >
            <ListItemText primary={item} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        <ListItemButton
          sx={{
            borderRadius: 1,
          }}
        >
          <ListItemText primary="Administración" />
        </ListItemButton>
      </List>

      <Box sx={{ mt: 'auto' }}>
        <Divider />

        <List sx={{ px: 1, py: 1 }}>
          <ListItemButton
            sx={{
              borderRadius: 1,
            }}
          >
            <ListItemText primary="Cerrar sesión" />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  )
}

export default Sidebar