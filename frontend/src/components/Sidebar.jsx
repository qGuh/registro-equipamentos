// src/components/Sidebar.jsx
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const { pathname } = useLocation();

  const isActive = (path) =>
    pathname === path ? "text-blue-500 font-semibold" : "text-white";

  return (
    <aside className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <h2 className="text-xl font-bold mb-8">SISTEMA-TI</h2>
      <nav className="flex flex-col gap-4">
        <Link to="/dashboard" className={isActive("/dashboard")}>
          Dashboard
        </Link>
        <Link to="/dashboard/colaboradores" className={isActive("/dashboard/colaboradores")}>
          Colaboradores
        </Link>
        <Link to="/dashboard/equipamentos" className={isActive("/dashboard/equipamentos")}>
          Equipamentos
        </Link>
        <Link to="/dashboard/contas" className={isActive("/dashboard/contas")}>
          Contas de Acesso
        </Link>
        <Link to="/dashboard/manutencoes" className={isActive("/dashboard/manutencoes")}>
          Manutenções
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;