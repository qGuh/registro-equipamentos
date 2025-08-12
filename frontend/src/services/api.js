// src/services/api.js
import axios from 'axios';

const baseURL =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000/api';

const api = axios.create({ baseURL });

// Envia o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// (opcional) padroniza mensagem de erro
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // você pode logar/transformar erros aqui se quiser
    return Promise.reject(err);
  }
);

export default api;