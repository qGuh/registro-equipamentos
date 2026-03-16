// src/services/dashboardTi.js
import api from './api';

export async function getSummary() {
  const res = await api.get('/dashboard-ti/summary');
  return res.data;
}

export async function getEquipamentosPorTipo() {
  const res = await api.get('/dashboard-ti/equipamentos-por-tipo');
  return res.data; // { items: [...] }
}