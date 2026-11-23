import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/layout/Layout'
import PortalLayout from './components/layout/PortalLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'

import Inicio from './pages/Inicio'
import Pacientes from './pages/Pacientes'
import Agenda from './pages/Agenda'
import FichaClinica from './pages/FichaClinica'
import Presupuestos from './pages/Presupuestos'
import Usuarios from './pages/Usuarios'
import Horarios from './pages/Horarios'
import Tratamientos from './pages/Tratamientos'
import Pagos from './pages/Pagos'

import PortalPaciente from './pages/PortalPaciente'
import MisCitas from './pages/MisCitas'
import ReservarCita from './pages/ReservarCita'
import MisAtenciones from './pages/MisAtenciones'
import MisPresupuestos from './pages/MisPresupuestos'
import MisPagos from './pages/MisPagos'
import MiPerfil from './pages/MiPerfil'
import Registro from './pages/Registro'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PÁGINAS PÚBLICAS
        ========================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Reserva de hora sin iniciar sesión (paciente invitado) */}
        <Route path="/reservar" element={<ReservarCita />} />

        {/* =========================
            PORTAL DEL PACIENTE
            Solo PACIENTE
        ========================= */}
        <Route element={<ProtectedRoute allowedRoles={['PACIENTE']} />}>
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<PortalPaciente />} />
            <Route path="citas" element={<MisCitas />} />
            <Route path="atenciones" element={<MisAtenciones />} />
            <Route path="presupuestos" element={<MisPresupuestos />} />
            <Route path="pagos" element={<MisPagos />} />
            <Route path="perfil" element={<MiPerfil />} />
          </Route>
          {/* La reserva tiene su propio encabezado (también se usa sin sesión) */}
          <Route path="/portal/reservar-cita" element={<ReservarCita />} />
        </Route>

        {/* =========================
            PORTAL DE GESTIÓN
            ADMIN / ODONTOLOGO / RECEPCIONISTA
            Cada página tiene además sus propios roles
            (los mismos que muestra el menú en Sidebar.tsx).
        ========================= */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ODONTOLOGO', 'RECEPCIONISTA']} />}>
          <Route path="/gestion" element={<Layout />}>
            <Route index element={<Navigate to="/gestion/inicio" replace />} />

            <Route path="inicio" element={<Inicio />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="horarios" element={<Horarios />} />

            {/* Solo odontólogo: datos clínicos */}
            <Route element={<ProtectedRoute allowedRoles={['ODONTOLOGO']} />}>
              <Route path="ficha-clinica" element={<FichaClinica />} />
            </Route>

            {/* Catálogo de tratamientos */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'ODONTOLOGO']} />}>
              <Route path="tratamientos" element={<Tratamientos />} />
            </Route>

            {/* Odontólogo (emite) y recepción (registra pagos) */}
            <Route element={<ProtectedRoute allowedRoles={['ODONTOLOGO', 'RECEPCIONISTA']} />}>
              <Route path="presupuestos" element={<Presupuestos />} />
            </Route>

            {/* Pagos y comprobantes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPCIONISTA']} />}>
              <Route path="pagos" element={<Pagos />} />
            </Route>

            {/* Solo administrador */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="usuarios" element={<Usuarios />} />
            </Route>
          </Route>
        </Route>

        {/* =========================
            RUTA NO ENCONTRADA
        ========================= */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
