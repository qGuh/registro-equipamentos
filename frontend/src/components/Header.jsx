// src/components/Header.jsx
import { useMemo } from "react";

const Header = () => {
  // Lê o usuário salvo pelo AuthLayout (/auth/me)
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const displayName = user?.nome || "Usuário";
  const displayPerfil = user?.perfil || null;
  const initials = (user?.nome || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-800">Painel de Controle</h1>

      <div className="flex items-center gap-4">
        {/* Info do usuário (oculto em telas muito pequenas) */}
        <div className="hidden sm:flex items-center gap-3 text-sm text-gray-700">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
            {initials}
          </div>
          <div className="leading-tight">
            <div className="font-medium">{displayName}</div>
            {displayPerfil && (
              <div className="text-xs text-gray-500">{displayPerfil}</div>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Sair
        </button>
      </div>
    </header>
  );
};

export default Header;