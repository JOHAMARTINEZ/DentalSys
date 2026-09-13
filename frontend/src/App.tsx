import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Inicio from './pages/Inicio'
import Pacientes from './pages/Pacientes'
import Agenda from './pages/Agenda'
import FichaClinica from './pages/FichaClinica'
import Presupuestos from './pages/Presupuestos'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/inicio" replace />} />
            <Route path="inicio" element={<Inicio />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="ficha-clinica" element={<FichaClinica />} />
            <Route path="presupuestos" element={<Presupuestos />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App