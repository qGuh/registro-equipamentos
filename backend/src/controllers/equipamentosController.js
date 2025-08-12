// src/controllers/equipamentosController.js
const db = require('../config/database'); // mysql2/promise pool

// helper: executar query simples
async function q(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

// captura usuário do token para log/histórico
function usuarioReq(req) {
  return req.user?.login || req.user?.nome || 'desconhecido';
}

// GET /api/equipamentos
exports.listar = async (req, res) => {
  try {
    const { q: termo = '', status } = req.query;
    const filtros = [];
    const params = [];

    if (termo) {
      filtros.push(`(tipo LIKE ? OR marca LIKE ? OR modelo LIKE ? OR numero_serie LIKE ? OR patrimonio LIKE ?)`);
      for (let i = 0; i < 5; i++) params.push(`%${termo}%`);
    }
    if (status) {
      filtros.push(`status = ?`);
      params.push(status);
    }

    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
    const sql = `SELECT e.*,
                        (SELECT COUNT(*) FROM historico_equipamentos h WHERE h.equipamento_id = e.id) AS total_eventos
                 FROM equipamentos e ${where}
                 ORDER BY e.created_at DESC, e.id DESC`;
    const rows = await q(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar equipamentos.' });
  }
};

// GET /api/equipamentos/:id
exports.obterPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await q(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar equipamento.' });
  }
};

// POST /api/equipamentos
exports.criar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const b = req.body ?? {};
    const tipo = (b.tipo || '').trim();
    if (!tipo) return res.status(400).json({ message: "Campo 'tipo' é obrigatório." });

    const marca = b.marca ?? null;
    const modelo = b.modelo ?? null;
    const numero_serie = b.numero_serie ?? null;
    const patrimonio = b.patrimonio ?? null;
    const descricao = b.descricao ?? null;
    const status = b.status || 'disponivel';
    const data_aquisicao = b.data_aquisicao ?? null;
    const valor_aquisicao = b.valor_aquisicao ?? null;

    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO equipamentos (tipo, marca, modelo, numero_serie, patrimonio, descricao, status, data_aquisicao, valor_aquisicao)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [tipo, marca, modelo, numero_serie, patrimonio, descricao, status, data_aquisicao, valor_aquisicao]
    );

    const novoId = result.insertId;

    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, para_status, usuario)
       VALUES (?, 'CADASTRO', ?, ?, ?)`,
      [novoId, 'Cadastro do equipamento', status, usuarioReq(req)]
    );

    await conn.commit();
    const [created] = await conn.execute(`SELECT * FROM equipamentos WHERE id = ?`, [novoId]);
    res.status(201).json(created[0]);
  } catch (err) {
    await (conn?.rollback?.());
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Número de série ou patrimônio já cadastrado.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar equipamento.' });
  } finally {
    conn.release();
  }
};

// PUT /api/equipamentos/:id
exports.atualizar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const atual = await q(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!atual.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });

    const antes = atual[0];
    const {
      tipo = antes.tipo,
      marca = antes.marca,
      modelo = antes.modelo,
      numero_serie = antes.numero_serie,
      patrimonio = antes.patrimonio,
      descricao = antes.descricao,
      status = antes.status,
      data_aquisicao = antes.data_aquisicao,
      valor_aquisicao = antes.valor_aquisicao
    } = req.body ?? {};

    await conn.beginTransaction();

    await conn.execute(
      `UPDATE equipamentos
         SET tipo=?, marca=?, modelo=?, numero_serie=?, patrimonio=?, descricao=?, status=?, data_aquisicao=?, valor_aquisicao=?
       WHERE id=?`,
      [
        (tipo ?? null),
        (marca ?? null),
        (modelo ?? null),
        (numero_serie ?? null),
        (patrimonio ?? null),
        (descricao ?? null),
        status,
        (data_aquisicao ?? null),
        (valor_aquisicao ?? null),
        id
      ]
    );

    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, usuario)
       VALUES (?, 'ATUALIZACAO', ?, ?, ?, ?)`,
      [id, 'Atualização de dados', antes.status, status, usuarioReq(req)]
    );

    await conn.commit();
    const [atualizado] = await conn.execute(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    res.json(atualizado[0]);
  } catch (err) {
    await (conn?.rollback?.());
    if (err?.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Número de série ou patrimônio já cadastrado.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar equipamento.' });
  } finally {
    conn.release();
  }
};

// DELETE /api/equipamentos/:id  (baixa lógica → status=inativo)
exports.remover = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const atual = await q(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!atual.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });

    await conn.beginTransaction();
    await conn.execute(`UPDATE equipamentos SET status='inativo', colaborador_atual_id=NULL WHERE id=?`, [id]);
    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, usuario)
       VALUES (?, 'BAIXA', 'Inativação do equipamento', ?, 'inativo', ?)`,
      [id, atual[0].status, usuarioReq(req)]
    );

    await conn.commit();
    res.json({ message: 'Equipamento inativado com sucesso.' });
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao inativar equipamento.' });
  } finally {
    conn.release();
  }
};

// GET /api/equipamentos/:id/historico
exports.historico = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await q(
      `SELECT h.*, c.nome AS colaborador_nome
         FROM historico_equipamentos h
         LEFT JOIN colaboradores c ON c.id = h.colaborador_id
        WHERE h.equipamento_id = ?
        ORDER BY h.data_hora DESC, h.id DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar histórico.' });
  }
};

// POST /api/equipamentos/:id/historico/alocar
exports.alocar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { colaborador_id, observacao } = req.body ?? {};

    const atual = await q(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!atual.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });
    const eq = atual[0];
    if (eq.status === 'inativo') return res.status(400).json({ message: 'Equipamento inativo.' });
    if (eq.status === 'alocado') return res.status(400).json({ message: 'Já está alocado.' });

    await conn.beginTransaction();
    await conn.execute(`UPDATE equipamentos SET status='alocado', colaborador_atual_id=? WHERE id=?`, [colaborador_id ?? null, id]);
    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, colaborador_id, usuario)
       VALUES (?, 'ALOCACAO', ?, ?, 'alocado', ?, ?)`,
      [id, observacao || 'Alocado ao colaborador', eq.status, colaborador_id ?? null, usuarioReq(req)]
    );

    await conn.commit();
    res.json({ message: 'Equipamento alocado com sucesso.' });
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao alocar equipamento.' });
  } finally {
    conn.release();
  }
};

// POST /api/equipamentos/:id/historico/desalocar
exports.desalocar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { observacao } = req.body ?? {};

    const atual = await q(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!atual.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });
    const eq = atual[0];
    if (eq.status !== 'alocado') return res.status(400).json({ message: 'Equipamento não está alocado.' });

    await conn.beginTransaction();
    await conn.execute(`UPDATE equipamentos SET status='disponivel', colaborador_atual_id=NULL WHERE id=?`, [id]);
    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, colaborador_id, usuario)
       VALUES (?, 'DESALOCACAO', ?, 'alocado', 'disponivel', ?, ?)`,
      [id, observacao || 'Devolução do equipamento', eq.colaborador_atual_id ?? null, usuarioReq(req)]
    );

    await conn.commit();
    res.json({ message: 'Equipamento desalocado com sucesso.' });
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao desalocar equipamento.' });
  } finally {
    conn.release();
  }
};