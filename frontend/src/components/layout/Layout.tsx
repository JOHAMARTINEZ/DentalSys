import Box from '@mui/material/Box'
import Sidebar from './Sidebar'
import Header from './Header'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Header />

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout