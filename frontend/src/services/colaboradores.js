// src/services/colaboradores.js
import api from './api';

// Lista colaboradores (pode receber filtros via params)
export async function listarColaboradores(params = {}) {
  // no backend: GET /colaboradores retorna array (sem paginação)
  const { data } = await api.get('/colaboradores', { params });
  return data; // []
}

// Buscar colaborador por ID
export async function obterColaborador(id) {
  const { data } = await api.get(`/colaboradores/${id}`);
  return data; // { ... }
}

// Criar colaborador
export async function criarColaborador(payload) {
  const { data } = await api.post('/colaboradores', payload);
  return data;
}

// Atualizar colaborador
export async function atualizarColaborador(id, payload) {
  const { data } = await api.put(`/colaboradores/${id}`, payload);
  return data;
}

// Excluir colaborador
export async function excluirColaborador(id) {
  const { data } = await api.delete(`/colaboradores/${id}`);
  return data;
}

// 🔎 Usado em autocomplete / buscas (por exemplo em Equipamentos)
export async function buscarColaboradores(termo = '') {
  const { data } = await api.get('/colaboradores', {
    params: {
      q: termo || undefined,
    },
  });
  return data;
}