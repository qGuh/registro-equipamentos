import { Routes, Route } from 'react-router-dom'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import Colaboradores from '../pages/Colaboradores'
import Equipamentos from '../pages/Equipamentos'
import Contas from '../pages/Contas'
import Manutencao from '../pages/Manutencao'
import AuthLayout from '../layouts/AuthLayout'
import DashboardLayout from '../components/DashboardLayout'
import NotFound from '../pages/NotFound'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/" element={<Login />} />

      {/* Protegidas */}
      <Route element={<AuthLayout />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/colaboradores" element={<Colaboradores />} />
          <Route path="/equipamentos" element={<Equipamentos />} />
          <Route path="/contas" element={<Contas />} />
          <Route path="/manutencao" element={<Manutencao />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}