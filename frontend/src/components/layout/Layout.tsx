import Box from '@mui/material/Box'
import Sidebar from './Sidebar'
import Header from './Header'

function Layout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Header />

        <Box sx={{ p: 3 }}>
          <h1>Contenido de DentalSys</h1>
        </Box>
      </Box>
    </Box>
  )
}

export default Layout
