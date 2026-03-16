// src/services/contas.js
import api from './api';

// Atualizado para a nova rota unificada do backend
const BASE_PATH = '/acessos-ti';

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

// ✅ exports nomeados (resolve o erro do console)
export async function listarContas(params = {}) {
  const res = await api.get(BASE_PATH, { params });
  return normalizeListResponse(res.data);
}

export async function excluirConta(id) {
  return api.delete(`${BASE_PATH}/${id}`);
}

export async function obterConta(id) {
  const res = await api.get(`${BASE_PATH}/${id}`);
  return res.data;
}

export async function criarConta(payload) {
  const res = await api.post(BASE_PATH, payload);
  return res.data;
}

export async function atualizarConta(id, payload) {
  const res = await api.put(`${BASE_PATH}/${id}`, payload);
  return res.data;
}