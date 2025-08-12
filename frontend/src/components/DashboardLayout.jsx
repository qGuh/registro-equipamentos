// src/components/DashboardLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(true) // sidebar aberta no desktop

  // Lê usuário salvo pelo AuthLayout (/auth/me)
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const linkBase =
    'px-3 py-2 rounded-md transition hover:bg-gray-800 hover:text-white'
  const linkActive = 'bg-red-600 text-white hover:bg-red-700'

  const displayName = user?.nome || 'Usuário'
  const displayPerfil = user?.perfil || null
  const initials = (user?.nome || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          open ? 'w-64' : 'w-0 md:w-16'
        } bg-gray-900 text-gray-300 transition-all duration-200 overflow-hidden flex flex-col justify-between`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">SISTEMA-TI</h2>
            <button
              className="md:hidden text-gray-300"
              onClick={() => setOpen(false)}
              title="Fechar menu"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ''}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/colaboradores"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ''}`
              }
            >
              Colaboradores
            </NavLink>
            <NavLink
              to="/equipamentos"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ''}`
              }
            >
              Equipamentos
            </NavLink>
            <NavLink
              to="/contas"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ''}`
              }
            >
              Contas de Acesso
            </NavLink>
            <NavLink
              to="/manutencao"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : ''}`
              }
            >
              Manutenção
            </NavLink>
          </nav>
        </div>

        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col">
        {/* Header topo */}
        <header className="bg-white shadow flex items-center justify-between px-4 h-14">
          <button
            className="md:hidden border px-3 py-1 rounded"
            onClick={() => setOpen(true)}
            title="Abrir menu"
          >
            ☰
          </button>

          <h1 className="text-gray-800 font-semibold">Painel de Controle</h1>

          {/* Usuário autenticado (dinâmico) */}
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div className="leading-tight text-right hidden sm:block">
              <div className="font-medium">{displayName}</div>
              {displayPerfil && (
                <div className="text-xs text-gray-500">{displayPerfil}</div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}