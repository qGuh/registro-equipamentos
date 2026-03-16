import api from './api';

// LISTAR
export async function listarManutencoes(params = {}) {
  const { q, status, equipamento_id, page, pageSize, sortBy, sortDir } = params;
  const { data } = await api.get('/manutencoes', {
    params: { q, status, equipamento_id, page, pageSize, sortBy, sortDir },
  });
  return data;
}

// BUSCAR POR ID
export async function obterManutencao(id) {
  const { data } = await api.get(`/manutencoes/${id}`);
  return data;
}

// CRIAR
export async function criarManutencao(payload) {
  const { data } = await api.post('/manutencoes', payload);
  return data;
}

// ATUALIZAR
export async function atualizarManutencao(id, payload) {
  const { data } = await api.put(`/manutencoes/${id}`, payload);
  return data;
}

// EXCLUIR
export async function excluirManutencao(id) {
  const { data } = await api.delete(`/manutencoes/${id}`);
  return data;
}

/* ---------- ANEXOS ---------- */
// Envia 1..N arquivos (multipart/form-data, campo "files")
export async function anexarArquivos(id, files) {
  const fd = new FormData();
  (Array.isArray(files) ? files : [files]).forEach(f => fd.append('files', f));
  const { data } = await api.post(`/manutencoes/${id}/anexos`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// Remove 1 arquivo por filename
export async function removerAnexo(id, filename) {
  const enc = encodeURIComponent(filename);
  const { data } = await api.delete(`/manutencoes/${id}/anexos/${enc}`);
  return data;
}

// aliases para compatibilidade (se algum lugar antigo ainda usar)
export const uploadAnexos = anexarArquivos;
export const removerManutencao = excluirManutencao;

export default {
  listarManutencoes,
  obterManutencao,
  criarManutencao,
  atualizarManutencao,
  excluirManutencao,
  anexarArquivos,
  removerAnexo,
  // aliases
  uploadAnexos,
  removerManutencao,
};