// src/routes/Routes.jsx
import { Routes, Route } from 'react-router-dom';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';

import ColaboradoresList from '../pages/Colaboradores/ColaboradoresList';
import ColaboradorForm from '../pages/Colaboradores/ColaboradorForm';

import Equipamentos from '../pages/Equipamentos/EquipamentosList';
import EquipamentoForm from '../pages/Equipamentos/EquipamentoForm';
import EquipamentoHistorico from '../pages/Equipamentos/EquipamentoHistorico';

import ContasList from '../pages/Contas/ContasList';
import ContasForm from "../pages/Contas/ContasForm";

import PecasList from '../pages/Pecas/PecasList';
import PecaForm from '../pages/Pecas/PecaForm';
import MovimentacoesPeca from '../pages/Pecas/MovimentacoesPeca';

import ManutencoesList from '../pages/Manutencao/ManutencoesList';
import ManutencaoForm from '../pages/Manutencao/ManutencaoForm';

import IndicadoresList from '../pages/Qualidade/IndicadoresList';
import LancamentosList from '../pages/Qualidade/LancamentosList';
import DashboardQualidade from '../pages/Qualidade/DashboardQualidade';

import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../components/DashboardLayout';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rota pública - Login */}
      <Route path="/" element={<Login />} />

      {/* Rotas protegidas */}
      <Route element={<AuthLayout />}>
        <Route element={<DashboardLayout />}>
          {/* Dashboard principal */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Colaboradores */}
          <Route path="/colaboradores" element={<ColaboradoresList />} />
          <Route path="/colaboradores/novo" element={<ColaboradorForm />} />
          <Route path="/colaboradores/:id/editar" element={<ColaboradorForm />} />

          {/* Equipamentos */}
          <Route path="/equipamentos" element={<Equipamentos />} />
          <Route path="/equipamentos/novo" element={<EquipamentoForm />} />
          <Route path="/equipamentos/:id/editar" element={<EquipamentoForm />} />
          <Route
            path="/equipamentos/:id/historico"
            element={<EquipamentoHistorico />}
          />

          {/* Contas */}
          <Route path="contas" element={<ContasList />} />
          <Route path="contas/novo" element={<ContasForm />} />
          <Route path="contas/:id/editar" element={<ContasForm />} />

          {/* Peças */}
          <Route path="/pecas" element={<PecasList />} />
          <Route path="/pecas/nova" element={<PecaForm />} />
          <Route path="/pecas/:id/editar" element={<PecaForm />} />
          <Route
            path="/pecas/:id/movimentacoes"
            element={<MovimentacoesPeca />}
          />

          {/* Qualidade */}
          <Route path="/qualidade/dashboard" element={<DashboardQualidade />} />
          <Route
            path="/qualidade/indicadores"
            element={<IndicadoresList />}
          />
          <Route path="/qualidade/lancamentos" element={<LancamentosList />} />

          {/* Manutenções */}
          <Route path="/manutencoes" element={<ManutencoesList />} />
          <Route path="/manutencoes/nova" element={<ManutencaoForm />} />
          <Route path="/manutencoes/:id/editar" element={<ManutencaoForm />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}