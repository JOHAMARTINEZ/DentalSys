import { useState } from 'react'
import Box from '@mui/material/Box'
import Sidebar from './Sidebar'
import Header from './Header'
import { Outlet } from 'react-router-dom'

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMenuClick = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleDrawerClose = () => {
    setMobileOpen(false)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={handleDrawerClose}
      />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Header onMenuClick={handleMenuClick} />

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout