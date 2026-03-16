import api from './api';

export async function listarPecas({ q='', page=1, pageSize=10, sortBy='nome', sortDir='asc' }) {
  const { data } = await api.get('/pecas', { params: { q, page, pageSize, sortBy, sortDir } });
  return data;
}

export async function exportarPecasCSV({ q='', sortBy='nome', sortDir='asc' }) {
  const resp = await api.get('/pecas/export', { params: { q, sortBy, sortDir }, responseType: 'blob' });
  return resp.data;
}

export async function obterPeca(id) {
  const { data } = await api.get(`/pecas/${id}`);
  return data;
}

export async function criarPeca(payload) {
  const { data } = await api.post('/pecas', payload);
  return data;
}

export async function atualizarPeca(id, payload) {
  const { data } = await api.put(`/pecas/${id}`, payload);
  return data;
}

export async function removerPeca(id) {
  const { data } = await api.delete(`/pecas/${id}`);
  return data;
}

export async function listarMovimentacoesPeca(id, { page=1, pageSize=10 } = {}) {
  const { data } = await api.get(`/pecas/${id}/movimentacoes`, { params: { page, pageSize } });
  return data;
}

export async function movimentarPeca(id, payload) {
  const { data } = await api.post(`/pecas/${id}/movimentar`, payload);
  return data;
}