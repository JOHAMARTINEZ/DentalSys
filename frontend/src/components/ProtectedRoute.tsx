import { Navigate, Outlet } from 'react-router-dom'

import { cerrarSesion, getRol, getToken } from '../services/api'
import type { Rol } from '../services/api'

interface ProtectedRouteProps {
  allowedRoles?: Rol[]
}

function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const token = getToken()
  const rol = getRol()

  // No está autenticado
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Sesión incompleta (sin rol): se limpia y se vuelve al login
  if (!rol) {
    cerrarSesion()
    return <Navigate to="/login" replace />
  }

  // La ruta no especifica roles:
  // cualquier usuario autenticado puede acceder.
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />
  }

  // El usuario no tiene un rol permitido: se envía a su inicio
  if (!allowedRoles.includes(rol)) {
    if (rol === 'PACIENTE') {
      return <Navigate to="/portal" replace />
    }

    return <Navigate to="/gestion/inicio" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
