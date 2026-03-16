// src/layouts/AuthLayout.jsx
import { Outlet, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AuthLayout() {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setOk(false);
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const { data } = await api.get('/auth/me');
        localStorage.setItem('user', JSON.stringify(data));
        setOk(true);
      } catch (error) {
        console.error('Erro ao validar sessão:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setOk(false);
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Verificando acesso...
      </div>
    );
  }

  return ok ? <Outlet /> : <Navigate to="/" replace />;
}