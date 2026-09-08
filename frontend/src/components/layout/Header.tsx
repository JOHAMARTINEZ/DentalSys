import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
       <Typography variant="h6" sx={{ flexGrow: 1 }}>
  Gestión Clínica Dental
</Typography>

        <Box>
          <Typography variant="body2">
            Usuario conectado
          </Typography>

        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header