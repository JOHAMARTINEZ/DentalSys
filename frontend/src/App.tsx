
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/Home'
import Login from './pages/Login'

import Inicio from './pages/Inicio'
import Pacientes from './pages/Pacientes'
import Agenda from './pages/Agenda'
import FichaClinica from './pages/FichaClinica'
import Presupuestos from './pages/Presupuestos'

import PortalPaciente from './pages/PortalPaciente'
import MisCitas from './pages/MisCitas'
import ReservarCita from './pages/ReservarCita'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PÁGINAS PÚBLICAS
        ========================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* =========================
            PORTAL DEL PACIENTE
        ========================= */}
        <Route element={<ProtectedRoute />}>
          <Route path="/portal" element={<PortalPaciente />} />
          <Route path="/portal/citas" element={<MisCitas />} />
          <Route path="/portal/reservar-cita" element={<ReservarCita />} />
        </Route>

        {/* =========================
            PORTAL DE GESTIÓN
        ========================= */}
        <Route element={<ProtectedRoute />}>
          <Route path="/gestion" element={<Layout />}>
            <Route
              index
              element={<Navigate to="/gestion/inicio" replace />}
            />

            <Route path="inicio" element={<Inicio />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="ficha-clinica" element={<FichaClinica />} />
            <Route path="presupuestos" element={<Presupuestos />} />
          </Route>
        </Route>

        {/* =========================
            RUTA NO ENCONTRADA
        ========================= */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
