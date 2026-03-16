const db = require('../config/database');

function toNullable(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
}

// -------------------------------------------------------------
// SETORES
// -------------------------------------------------------------
exports.getSetores = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nome FROM qualidade_setores ORDER BY nome');
    return res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
    return res.status(500).json({ message: 'Erro ao buscar setores de qualidade.' });
  }
};

// -------------------------------------------------------------
// INDICADORES
// -------------------------------------------------------------
exports.getIndicadores = async (req, res) => {
  try {
    const { setor_id } = req.query;
    const conditions = [];
    const params = [];

    if (setor_id && setor_id !== 'todos') {
      conditions.push('qi.setor_id = ?');
      params.push(setor_id);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT qi.id, qi.setor_id, qs.nome AS setor_nome, qs.nome AS setor, qi.nome, qi.descricao, qi.unidade, qi.meta_mensal
      FROM qualidade_indicadores qi
      JOIN qualidade_setores qs ON qs.id = qi.setor_id
      ${where} ORDER BY qs.nome, qi.nome
    `, params);

    return res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar indicadores:', error);
    return res.status(500).json({ message: 'Erro ao buscar indicadores.' });
  }
};

exports.createIndicador = async (req, res) => {
  try {
    const { setor_id, nome, descricao, unidade, meta_mensal } = req.body;
    if (!setor_id || !nome || !unidade) return res.status(400).json({ message: 'setor_id, nome e unidade obrigatórios.' });

    const [result] = await db.query(
      `INSERT INTO qualidade_indicadores (setor_id, nome, descricao, unidade, meta_mensal) VALUES (?, ?, ?, ?, ?)`,
      [setor_id, nome.trim(), toNullable(descricao), unidade.trim(), toNullable(meta_mensal)]
    );

    const [[novo]] = await db.query(`SELECT * FROM qualidade_indicadores WHERE id = ?`, [result.insertId]);
    return res.status(201).json(novo);
  } catch (error) {
    console.error('Erro ao criar indicador:', error);
    return res.status(500).json({ message: 'Erro ao criar indicador.' });
  }
};

exports.updateIndicador = async (req, res) => {
  try {
    const { id } = req.params;
    const { setor_id, nome, descricao, unidade, meta_mensal } = req.body;
    if (!setor_id || !nome || !unidade) return res.status(400).json({ message: 'Campos obrigatórios faltando.' });

    await db.query(
      `UPDATE qualidade_indicadores SET setor_id = ?, nome = ?, descricao = ?, unidade = ?, meta_mensal = ? WHERE id = ?`,
      [setor_id, nome.trim(), toNullable(descricao), unidade.trim(), toNullable(meta_mensal), id]
    );

    return res.json({ message: 'Atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar indicador:', error);
    return res.status(500).json({ message: 'Erro ao atualizar indicador.' });
  }
};

exports.deleteIndicador = async (req, res) => {
  try {
    await db.query('DELETE FROM qualidade_indicadores WHERE id = ?', [req.params.id]);
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir indicador:', error);
    return res.status(500).json({ message: 'Erro ao excluir indicador.' });
  }
};

// -------------------------------------------------------------
// LANÇAMENTOS (REGISTROS)
// -------------------------------------------------------------
exports.getRegistros = async (req, res) => {
  try {
    const { ano, setor_id, indicador_id } = req.query;
    const params = [];
    const whereParts = ['1 = 1'];

    if (ano) { whereParts.push('r.ano = ?'); params.push(Number(ano)); }
    if (setor_id && setor_id !== 'todos') { whereParts.push('qi.setor_id = ?'); params.push(Number(setor_id)); }
    if (indicador_id && indicador_id !== 'todos') { whereParts.push('r.indicador_id = ?'); params.push(Number(indicador_id)); }

    const sql = `
      SELECT r.*, qi.nome AS indicador_nome, qi.setor_id, qs.nome AS setor_nome
      FROM qualidade_lancamentos r
      JOIN qualidade_indicadores qi ON qi.id = r.indicador_id
      JOIN qualidade_setores qs ON qs.id = qi.setor_id
      WHERE ${whereParts.join(' AND ')}
      ORDER BY r.ano DESC, r.mes DESC, qs.nome, qi.nome
    `;
    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return res.status(500).json({ message: 'Erro ao buscar lançamentos.' });
  }
};

exports.createRegistro = async (req, res) => {
  try {
    const { indicador_id, ano, mes, previsto, realizado, observacao } = req.body;
    if (!indicador_id || !ano || !mes) return res.status(400).json({ message: 'indicador_id, ano e mes são obrigatórios.' });

    const [result] = await db.query(
      `INSERT INTO qualidade_lancamentos (indicador_id, ano, mes, previsto, realizado, observacao) VALUES (?, ?, ?, ?, ?, ?)`,
      [indicador_id, Number(ano), Number(mes), toNullable(previsto) || 0, toNullable(realizado) || 0, toNullable(observacao)]
    );
    const [[novo]] = await db.query(`SELECT * FROM qualidade_lancamentos WHERE id = ?`, [result.insertId]);
    return res.status(201).json(novo);
  } catch (error) {
    console.error('Erro ao criar lançamento:', error);
    return res.status(500).json({ message: 'Erro ao criar lançamento.' });
  }
};

exports.updateRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const { indicador_id, ano, mes, previsto, realizado, observacao } = req.body;
    
    await db.query(
      `UPDATE qualidade_lancamentos SET indicador_id = ?, ano = ?, mes = ?, previsto = ?, realizado = ?, observacao = ? WHERE id = ?`,
      [indicador_id, Number(ano), Number(mes), toNullable(previsto) || 0, toNullable(realizado) || 0, toNullable(observacao), id]
    );
    return res.json({ message: 'Lançamento atualizado.' });
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error);
    return res.status(500).json({ message: 'Erro ao atualizar.' });
  }
};

exports.deleteRegistro = async (req, res) => {
  try {
    await db.query('DELETE FROM qualidade_lancamentos WHERE id = ?', [req.params.id]);
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir lançamento:', error);
    return res.status(500).json({ message: 'Erro ao excluir.' });
  }
};

// -------------------------------------------------------------
// DASHBOARD
// -------------------------------------------------------------
exports.getDashboard = async (req, res) => {
  try {
    const { ano, setor_id, indicador_id, meses } = req.query;
    const params = [];
    const whereParts = ['1 = 1'];

    if (ano) { whereParts.push('r.ano = ?'); params.push(Number(ano)); }
    if (setor_id && setor_id !== 'todos') { whereParts.push('qi.setor_id = ?'); params.push(Number(setor_id)); }
    if (indicador_id && indicador_id !== 'todos') { whereParts.push('r.indicador_id = ?'); params.push(Number(indicador_id)); }

    let mesesArr = [];
    if (typeof meses === 'string' && meses.trim()) {
      mesesArr = meses.split(',').map(m => Number(m.trim()));
      whereParts.push(`r.mes IN (${mesesArr.map(() => '?').join(',')})`);
      params.push(...mesesArr);
    }

    const sqlResumo = `
      SELECT COALESCE(SUM(r.previsto), 0) AS total_previsto, COALESCE(SUM(r.realizado), 0) AS total_realizado,
             CASE WHEN SUM(r.previsto) > 0 THEN ROUND(SUM(r.realizado) / SUM(r.previsto) * 100, 2) ELSE NULL END AS percentual_atingimento
      FROM qualidade_lancamentos r
      JOIN qualidade_indicadores qi ON qi.id = r.indicador_id
      WHERE ${whereParts.join(' AND ')}
    `;

    const sqlPorMes = `
      SELECT r.ano, r.mes, COALESCE(SUM(r.previsto), 0) AS total_previsto, COALESCE(SUM(r.realizado), 0) AS total_realizado
      FROM qualidade_lancamentos r
      JOIN qualidade_indicadores qi ON qi.id = r.indicador_id
      WHERE ${whereParts.join(' AND ')}
      GROUP BY r.ano, r.mes ORDER BY r.ano, r.mes
    `;

    const [[resumo]] = await db.query(sqlResumo, params);
    const [porMes] = await db.query(sqlPorMes, params);

    return res.json({ resumo: resumo || { total_previsto: 0, total_realizado: 0, percentual_atingimento: null }, porMes });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    return res.status(500).json({ message: 'Erro ao carregar dashboard.' });
  }
};