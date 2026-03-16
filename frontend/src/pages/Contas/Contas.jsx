// src/services/contas.js
import api from './api';

// Ajuste se sua rota no backend for diferente:
// exemplos: '/contas', '/contas-acesso', '/contasAcesso'
const BASE_PATH = '/contas';

function normalizeListResponse(payload) {
  const items =
    payload?.data ??
    payload?.rows ??
    payload?.items ??
    (Array.isArray(payload) ? payload : []);

  const total =
    payload?.total ??
    payload?.count ??
    payload?.totalItems ??
    (Array.isArray(items) ? items.length : 0);

  return { items: Array.isArray(items) ? items : [], total: Number(total) || 0 };
}

export async function listarContas(params = {}) {
  const res = await api.get(BASE_PATH, { params });
  return normalizeListResponse(res.data);
}

export async function excluirConta(id) {
  return api.delete(`${BASE_PATH}/${id}`);
}