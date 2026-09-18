import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import MenuIcon from '@mui/icons-material/Menu'

interface HeaderProps {
  onMenuClick: () => void
}

function Header({ onMenuClick }: HeaderProps) {
  const username = localStorage.getItem('dentalsys_username') || 'Usuario'

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: '#FFFFFF',
        color: '#1F2937',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <Toolbar
        sx={{
          minHeight: 72,
          px: { xs: 2, sm: 3 },
        }}
      >
        <IconButton
          onClick={onMenuClick}
          edge="start"
          sx={{
            mr: 2,
            color: '#4B5563',
            display: { xs: 'inline-flex', sm: 'none' },
          }}
          aria-label="Abrir menú"
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              fontSize: { xs: '1rem', sm: '1.15rem' },
            }}
          >
            Gestión Clínica Dental
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', sm: 'block' },
              textAlign: 'right',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: '#1F2937',
              }}
            >
              {username}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              Usuario conectado
            </Typography>
          </Box>

          <Avatar
            sx={{
              width: 38,
              height: 38,
              backgroundColor: '#E8F0FE',
              color: '#2563EB',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {username.charAt(0).toUpperCase()}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header