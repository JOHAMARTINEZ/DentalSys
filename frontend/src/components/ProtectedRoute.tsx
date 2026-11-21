import { Navigate, Outlet } from 'react-router-dom'

type Rol =
  | 'ADMIN'
  | 'RECEPCIONISTA'
  | 'ODONTOLOGO'
  | 'PACIENTE'

interface ProtectedRouteProps {
  allowedRoles?: Rol[]
}

function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const token = localStorage.getItem('dentalsys_token')
  const rol = localStorage.getItem('dentalsys_rol') as Rol | null

  // No está autenticado
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // La ruta no especifica roles:
  // cualquier usuario autenticado puede acceder.
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />
  }

  // El usuario no tiene un rol permitido
  if (!rol || !allowedRoles.includes(rol)) {
    if (rol === 'PACIENTE') {
      return <Navigate to="/portal" replace />
    }

    return <Navigate to="/gestion/inicio" replace />
  }

  return <Outlet />
}

export default ProtectedRoute