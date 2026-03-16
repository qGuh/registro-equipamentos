// src/services/qualidade.js
import api from "./api";

// -------- SETORES --------
async function getSetores() {
  const { data } = await api.get("/qualidade/setores");
  return data;
}

// -------- INDICADORES --------
async function getIndicadores(params = {}) {
  const { data } = await api.get("/qualidade/indicadores", {
    params,
  });
  return data;
}

async function createIndicador(payload) {
  const { data } = await api.post("/qualidade/indicadores", payload);
  return data;
}

async function updateIndicador(id, payload) {
  const { data } = await api.put(`/qualidade/indicadores/${id}`, payload);
  return data;
}

async function deleteIndicador(id) {
  const { data } = await api.delete(`/qualidade/indicadores/${id}`);
  return data;
}

// -------- DASHBOARD DE QUALIDADE --------
async function getDashboard(params = {}) {
  const { data } = await api.get("/qualidade/dashboard", {
    params,
  });
  return data;
}

// -------- LANÇAMENTOS (REGISTROS) --------
async function getRegistros(params = {}) {
  const { data } = await api.get("/qualidade/registros", {
    params,
  });
  return data;
}

async function createRegistro(payload) {
  const { data } = await api.post("/qualidade/registros", payload);
  return data;
}

async function updateRegistro(id, payload) {
  const { data } = await api.put(`/qualidade/registros/${id}`, payload);
  return data;
}

async function deleteRegistro(id) {
  const { data } = await api.delete(`/qualidade/registros/${id}`);
  return data;
}

// export default (se em algum lugar você estiver usando import default)
const qualidadeService = {
  getSetores,
  getIndicadores,
  createIndicador,
  updateIndicador,
  deleteIndicador,
  getDashboard,
  getRegistros,
  createRegistro,
  updateRegistro,
  deleteRegistro,
};

export default qualidadeService;

// named exports (para os imports que você já tem hoje)
export {
  getSetores,
  getIndicadores,
  createIndicador,
  updateIndicador,
  deleteIndicador,
  getDashboard,
  getRegistros,
  createRegistro,
  updateRegistro,
  deleteRegistro,
};