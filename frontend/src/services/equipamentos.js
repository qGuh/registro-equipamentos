// src/services/equipamentos.js
import api from './api';

export const listarEquipamentos = (params) => api.get('/equipamentos', { params }).then(r => r.data);
export const obterEquipamento = (id) => api.get(`/equipamentos/${id}`).then(r => r.data);
export const criarEquipamento = (data) => api.post('/equipamentos', data).then(r => r.data);
export const atualizarEquipamento = (id, data) => api.put(`/equipamentos/${id}`, data).then(r => r.data);
export const removerEquipamento = (id) => api.delete(`/equipamentos/${id}`).then(r => r.data);

export const listarHistoricoEquip = (id) => api.get(`/equipamentos/${id}/historico`).then(r => r.data);
export const alocarEquipamento = (id, payload) => api.post(`/equipamentos/${id}/historico/alocar`, payload).then(r => r.data);
export const desalocarEquipamento = (id, payload) => api.post(`/equipamentos/${id}/historico/desalocar`, payload).then(r => r.data);