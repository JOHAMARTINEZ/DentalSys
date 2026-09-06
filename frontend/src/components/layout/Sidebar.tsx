import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Typography from '@mui/material/Typography'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

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
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">
          DentalSys
        </Typography>
      </Box>

      <List>
        <ListItemButton>
          <ListItemText primary="Inicio" />
        </ListItemButton>

        <ListItemButton>
          <ListItemText primary="Pacientes" />
        </ListItemButton>

        <ListItemButton>
          <ListItemText primary="Agenda" />
        </ListItemButton>

        <ListItemButton>
          <ListItemText primary="Ficha Clínica" />
        </ListItemButton>

        <ListItemButton>
          <ListItemText primary="Presupuestos" />
        </ListItemButton>
      </List>

      <Divider />

      <List>
        <ListItemButton>
          <ListItemText primary="Administración" />
        </ListItemButton>
      </List>

      <Box sx={{ mt: 'auto' }}>
        <List>
          <ListItemButton>
            <ListItemText primary="Cerrar sesión" />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
  )
}

export default Sidebar