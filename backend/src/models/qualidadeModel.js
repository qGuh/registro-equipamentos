// src/models/qualidadeModel.js
const db = require('../config/database');

// === SETORES ===
async function listarSetoresAtivos() {
  const [rows] = await db.query(
    'SELECT id, nome, sigla FROM setores_qualidade WHERE ativo = 1 ORDER BY nome'
  );
  return rows;
}

// === INDICADORES ===
async function listarIndicadores({ setorId, ativo = true }) {
  let sql = `
    SELECT i.id, i.nome, i.descricao, i.unidade, i.meta_prevista,
           i.melhor_sentido, i.periodicidade, i.ativo,
           s.id AS setor_id, s.nome AS setor_nome
    FROM indicadores_qualidade i
    JOIN setores_qualidade s ON s.id = i.setor_id
    WHERE 1=1
  `;
  const params = [];

  if (setorId) {
    sql += ' AND i.setor_id = ?';
    params.push(setorId);
  }

  if (ativo !== undefined) {
    sql += ' AND i.ativo = ?';
    params.push(ativo ? 1 : 0);
  }

  sql += ' ORDER BY s.nome, i.nome';

  const [rows] = await db.query(sql, params);
  return rows;
}

async function criarIndicador(dados) {
  const {
    setor_id,
    nome,
    descricao,
    unidade,
    meta_prevista,
    melhor_sentido,
    periodicidade,
  } = dados;

  const [result] = await db.query(
    `INSERT INTO indicadores_qualidade
      (setor_id, nome, descricao, unidade, meta_prevista, melhor_sentido, periodicidade)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      setor_id,
      nome,
      descricao || null,
      unidade,
      meta_prevista ?? null,
      melhor_sentido || 'MAIOR',
      periodicidade || 'MENSAL',
    ]
  );

  return result.insertId;
}

// === REGISTROS (PREVISTO x REALIZADO) ===
async function listarRegistros({ ano, setorId, indicadorId }) {
  let sql = `
    SELECT 
      r.id,
      r.indicador_id,
      r.competencia_ano,
      r.competencia_mes,
      r.previsto,
      r.realizado,
      r.percentual,
      r.observacao,
      i.nome AS indicador_nome,
      i.unidade,
      s.id AS setor_id,
      s.nome AS setor_nome
    FROM registros_indicadores r
    JOIN indicadores_qualidade i ON i.id = r.indicador_id
    JOIN setores_qualidade s ON s.id = i.setor_id
    WHERE 1=1
  `;
  const params = [];

  if (ano) {
    sql += ' AND r.competencia_ano = ?';
    params.push(ano);
  }

  if (setorId) {
    sql += ' AND s.id = ?';
    params.push(setorId);
  }

  if (indicadorId) {
    sql += ' AND i.id = ?';
    params.push(indicadorId);
  }

  sql += `
    ORDER BY s.nome, i.nome, r.competencia_ano DESC, r.competencia_mes ASC
  `;

  const [rows] = await db.query(sql, params);
  return rows;
}

// upsert: cria ou atualiza o registro do mês
async function salvarRegistro({
  indicador_id,
  competencia_ano,
  competencia_mes,
  previsto,
  realizado,
  observacao,
  criado_por,
}) {
  const previstoNum =
    previsto === undefined || previsto === null || previsto === ''
      ? null
      : Number(previsto);

  const realizadoNum = Number(realizado);

  let percentual = null;
  if (previstoNum && previstoNum !== 0) {
    percentual = (realizadoNum / previstoNum) * 100;
  }

  const sql = `
    INSERT INTO registros_indicadores
      (indicador_id, competencia_ano, competencia_mes, previsto, realizado, percentual, observacao, criado_por)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      previsto = VALUES(previsto),
      realizado = VALUES(realizado),
      percentual = VALUES(percentual),
      observacao = VALUES(observacao),
      atualizado_em = CURRENT_TIMESTAMP
  `;

  const params = [
    indicador_id,
    competencia_ano,
    competencia_mes,
    previstoNum,
    realizadoNum,
    percentual,
    observacao || null,
    criado_por,
  ];

  const [result] = await db.query(sql, params);
  return result;
}

// === DASHBOARD (dados consolidados para gráficos) ===
async function obterDadosDashboard({ ano, setorId }) {
  let sql = `
    SELECT
      s.id AS setor_id,
      s.nome AS setor_nome,
      i.id AS indicador_id,
      i.nome AS indicador_nome,
      i.unidade,
      i.melhor_sentido,
      r.competencia_ano,
      r.competencia_mes,
      r.previsto,
      r.realizado,
      r.percentual
    FROM registros_indicadores r
    JOIN indicadores_qualidade i ON i.id = r.indicador_id
    JOIN setores_qualidade s ON s.id = i.setor_id
    WHERE r.competencia_ano = ?
  `;
  const params = [ano];

  if (setorId) {
    sql += ' AND s.id = ?';
    params.push(setorId);
  }

  sql += `
    ORDER BY s.nome, i.nome, r.competencia_mes
  `;

  const [rows] = await db.query(sql, params);
  return rows;
}

module.exports = {
  listarSetoresAtivos,
  listarIndicadores,
  criarIndicador,
  listarRegistros,
  salvarRegistro,
  obterDadosDashboard,
};