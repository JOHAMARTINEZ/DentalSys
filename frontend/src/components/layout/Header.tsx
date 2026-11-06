import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import MenuIcon from '@mui/icons-material/Menu'
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined'

interface HeaderProps {
  onMenuClick: () => void
}

function Header({ onMenuClick }: HeaderProps) {
  const username = localStorage.getItem('dentalsys_username') || 'Usuario'

  const initial = username.charAt(0).toUpperCase()

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

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#EEF5FF',
              color: '#2563EB',
            }}
          >
            <MedicalServicesOutlinedIcon fontSize="small" />
          </Box>

          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                lineHeight: 1.2,
                fontSize: { xs: '1rem', sm: '1.1rem' },
                color: '#1F2937',
              }}
            >
              Gestión Clínica Dental
            </Typography>

            <Typography
              variant="caption"
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: '#6B7280',
              }}
            >
              Administración de la clínica
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
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
                lineHeight: 1.3,
              }}
            >
              {username}
            </Typography>

            <Chip
              label="Sesión activa"
              size="small"
              sx={{
                mt: 0.4,
                height: 20,
                fontSize: '0.68rem',
                fontWeight: 600,
                backgroundColor: '#ECFDF5',
                color: '#059669',
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          </Box>

          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: '#EEF5FF',
              color: '#2563EB',
              fontSize: '0.95rem',
              fontWeight: 700,
              border: '2px solid #E5EFFF',
            }}
          >
            {initial}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header