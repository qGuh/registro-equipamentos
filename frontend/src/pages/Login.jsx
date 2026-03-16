// src/pages/Login.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();

  const [loginValue, setLoginValue] = useState(''); // email ou usuário
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Se já tiver token, manda pro dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        // 👇 backend espera "login", não "email"
        login: loginValue.trim(),
        senha,
      });

      const token = data?.token;
      if (!token) {
        throw new Error('Token não retornado pelo servidor.');
      }

      // salva token
      localStorage.setItem('token', token);

      // se o backend já devolver o usuário, salva também (opcional)
      const userData = data?.user || data?.usuario;
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }

      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.erro ||
        error?.message ||
        'Falha ao fazer login.';
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          SISTEMA-TI
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Acesse com suas credenciais
        </p>

        {erro && (
          <div className="mb-4 text-sm text-red-600 text-center">{erro}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              E-mail ou usuário
            </label>
            <input
              type="text" // 👈 deixa como texto pra aceitar user ou email
              className="border rounded-md px-3 py-2 text-sm"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              className="border rounded-md px-3 py-2 text-sm"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-md text-sm disabled:opacity-70"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}