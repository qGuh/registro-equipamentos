import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import api from '../services/api'

export default function Login() {
  const [loginValue, setLoginValue] = useState('') // pode ser email OU usuário
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (localStorage.getItem('token')) {
    return <Navigate to="/dashboard" />
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', {
        login: loginValue.trim(), // backend aceita login OU email
        senha,
      })
      const token = data?.token
      if (!token) throw new Error('Token não retornado pelo servidor.')
      localStorage.setItem('token', token)
      navigate('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Falha no login.'
      setErro(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Acesso ao Sistema</h2>

        {erro && <div className="mb-4 text-red-600 text-sm text-center">{erro}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"                                // <--- aqui!
            placeholder="E-mail ou usuário"
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            autoCapitalize="off"
            autoComplete="username"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}