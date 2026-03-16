// src/controllers/equipamentosController.js
const db = require('../config/database'); 

// -------------------------------------------------------------
// Helpers de Banco de Dados e Auditoria
// -------------------------------------------------------------
async function q(sql, params = []) {
  const [rows] = await db.execute(sql, params);
  return rows;
}

function usuarioReq(req) {
  return req.user?.login || req.user?.nome || (req.user?.id ? `user#${req.user.id}` : 'Sistema');
}

const toNull = (v) =>
  (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) ? null : v;

const toNumberNull = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const num = Number(String(v).replace(',', '.'));
  return Number.isFinite(num) ? num : null;
};

// Grava também no Log Global do Sistema para manter o padrão
async function registarAuditoriaGlobal(usuario, acao, id_registro, detalhes) {
  try {
    await db.execute(
      `INSERT INTO log_auditoria (usuario, acao, tabela_afetada, id_registro, data_hora, detalhes) 
       VALUES (?, ?, 'equipamentos', ?, NOW(), ?)`,
      [usuario || 'Sistema', acao, id_registro, JSON.stringify(detalhes)]
    );
  } catch (err) {
    console.error('Erro ao gravar log de auditoria global:', err);
  }
}

function buildFiltro({ termo, status }) {
  const filtros = [];
  const params = [];
  if (termo) {
    filtros.push(
      `(e.tipo LIKE ? OR e.marca LIKE ? OR e.modelo LIKE ? OR e.numero_serie LIKE ? OR e.patrimonio LIKE ? OR c.nome LIKE ?)`
    );
    for (let i = 0; i < 6; i++) params.push(`%${termo}%`);
  }
  if (status) {
    filtros.push(`e.status = ?`);
    params.push(status);
  }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
  return { where, params };
}

// -------------------------------------------------------------
// Controladores Principais
// -------------------------------------------------------------

exports.listar = async (req, res) => {
  try {
    const { q: termo = '', status, page = 1, pageSize = 10, sortBy = 'created_at', sortDir = 'desc' } = req.query;

    const PAGE = Math.max(parseInt(page) || 1, 1);
    const SIZE = Math.min(Math.max(parseInt(pageSize) || 10, 1), 100);

    const allowedSort = new Set(['id','tipo','marca','modelo','numero_serie','patrimonio','status','created_at','colaborador_nome']);
    const by = allowedSort.has(String(sortBy)) ? String(sortBy) : 'created_at';
    const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const orderExpr = by === 'colaborador_nome' ? 'c.nome' : `e.${by}`;
    const offset = (PAGE - 1) * SIZE;
    const { where, params } = buildFiltro({ termo, status });

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM equipamentos e LEFT JOIN colaboradores c ON c.id = e.colaborador_atual_id ${where}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const sqlItens = `
      SELECT e.*, c.nome AS colaborador_nome,
             (SELECT COUNT(*) FROM historico_equipamentos h WHERE h.equipamento_id = e.id) AS total_eventos
        FROM equipamentos e
        LEFT JOIN colaboradores c ON c.id = e.colaborador_atual_id
        ${where}
       ORDER BY ${orderExpr} ${dir} LIMIT ${SIZE} OFFSET ${offset}`;
       
    const [items] = await db.execute(sqlItens, params);

    res.json({ items, page: PAGE, pageSize: SIZE, total, totalPages: Math.ceil(total / SIZE) || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar equipamentos.' });
  }
};

exports.obterPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await q(
      `SELECT e.*, c.nome AS colaborador_nome FROM equipamentos e LEFT JOIN colaboradores c ON c.id = e.colaborador_atual_id WHERE e.id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar equipamento.' });
  }
};

exports.criar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const b = req.body ?? {};
    const tipo = (b.tipo || '').trim();
    if (!tipo) return res.status(400).json({ message: "Campo 'tipo' é obrigatório." });

    const marca           = toNull(b.marca);
    const modelo          = toNull(b.modelo);
    const numero_serie    = toNull(b.numero_serie);
    const patrimonio      = toNull(b.patrimonio);
    const descricao       = toNull(b.descricao);
    const status          = b.status || 'disponivel';
    const data_aquisicao  = toNull(b.data_aquisicao);
    const valor_aquisicao = toNumberNull(b.valor_aquisicao);
    const data_entrega    = toNull(b.data_entrega);
    const data_recolhimento = toNull(b.data_recolhimento);
    const observacoes     = toNull(b.observacoes || b.observacao);

    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO equipamentos (tipo, marca, modelo, numero_serie, patrimonio, descricao, status, data_aquisicao, valor_aquisicao, data_entrega, data_recolhimento, observacoes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [tipo, marca, modelo, numero_serie, patrimonio, descricao, status, data_aquisicao, valor_aquisicao, data_entrega, data_recolhimento, observacoes]
    );

    const novoId = result.insertId;
    const usuario = usuarioReq(req);

    // Grava histórico específico do Equipamento
    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, para_status, usuario) VALUES (?, 'CADASTRO', ?, ?, ?)`,
      [novoId, 'Cadastro do equipamento', status, usuario]
    );

    await conn.commit();
    await registarAuditoriaGlobal(usuario, 'INSERÇÃO', novoId, b);

    const [created] = await db.execute(`SELECT * FROM equipamentos WHERE id = ?`, [novoId]);
    res.status(201).json(created[0]);
  } catch (err) {
    await (conn?.rollback?.());
    if (err?.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Número de série ou patrimônio já cadastrado.' });
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar equipamento.' });
  } finally {
    conn.release();
  }
};

exports.atualizar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const [atual] = await conn.execute(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!atual.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });

    const antes = atual[0];
    const b = req.body || {};

    const tipo = b.tipo !== undefined ? String(b.tipo).trim() : antes.tipo;
    if (!tipo) return res.status(400).json({ message: "Campo 'tipo' é obrigatório." });

    const marca           = b.marca !== undefined ? toNull(b.marca) : antes.marca;
    const modelo          = b.modelo !== undefined ? toNull(b.modelo) : antes.modelo;
    const numero_serie    = b.numero_serie !== undefined ? toNull(b.numero_serie) : antes.numero_serie;
    const patrimonio      = b.patrimonio !== undefined ? toNull(b.patrimonio) : antes.patrimonio;
    const descricao       = b.descricao !== undefined ? toNull(b.descricao) : antes.descricao;
    const status          = b.status !== undefined ? b.status : antes.status;
    const data_aquisicao  = b.data_aquisicao !== undefined ? toNull(b.data_aquisicao) : antes.data_aquisicao;
    const valor_aquisicao = b.valor_aquisicao !== undefined ? toNumberNull(b.valor_aquisicao) : antes.valor_aquisicao;
    const data_entrega    = b.data_entrega !== undefined ? toNull(b.data_entrega) : antes.data_entrega;
    const data_recolhimento = b.data_recolhimento !== undefined ? toNull(b.data_recolhimento) : antes.data_recolhimento;
    const observacoes     = b.observacoes !== undefined ? toNull(b.observacoes) : (b.observacao !== undefined ? toNull(b.observacao) : antes.observacoes);

    await conn.beginTransaction();

    await conn.execute(
      `UPDATE equipamentos
         SET tipo=?, marca=?, modelo=?, numero_serie=?, patrimonio=?, descricao=?, status=?, data_aquisicao=?, valor_aquisicao=?, data_entrega=?, data_recolhimento=?, observacoes=?
       WHERE id=?`,
      [tipo, marca, modelo, numero_serie, patrimonio, descricao, status, data_aquisicao, valor_aquisicao, data_entrega, data_recolhimento, observacoes, id]
    );

    const usuario = usuarioReq(req);
    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, usuario) VALUES (?, 'ATUALIZACAO', ?, ?, ?, ?)`,
      [id, 'Atualização de dados', antes.status, status, usuario]
    );

    await conn.commit();
    await registarAuditoriaGlobal(usuario, 'ATUALIZAÇÃO', id, b);

    const [atualizado] = await db.execute(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    res.json(atualizado[0]);
  } catch (err) {
    await (conn?.rollback?.());
    if (err?.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Número de série ou patrimônio já cadastrado.' });
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar equipamento.' });
  } finally {
    conn.release();
  }
};

exports.alocar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { colaborador_id, observacao } = req.body ?? {};

    const [atual] = await conn.execute(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!atual.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });
    
    const eq = atual[0];
    if (eq.status === 'inativo') return res.status(400).json({ message: 'Equipamento inativo não pode ser alocado.' });
    if (eq.status === 'alocado') return res.status(400).json({ message: 'Equipamento já está alocado.' });

    const usuario = usuarioReq(req);
    await conn.beginTransaction();
    await conn.execute(`UPDATE equipamentos SET status='alocado', colaborador_atual_id=? WHERE id=?`, [colaborador_id ?? null, id]);
    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, colaborador_id, usuario) VALUES (?, 'ALOCACAO', ?, ?, 'alocado', ?, ?)`,
      [id, observacao || 'Equipamento alocado ao colaborador', eq.status, colaborador_id ?? null, usuario]
    );

    await conn.commit();
    await registarAuditoriaGlobal(usuario, 'ALOCAÇÃO', id, req.body);
    res.json({ message: 'Equipamento alocado com sucesso.' });
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao alocar equipamento.' });
  } finally {
    conn.release();
  }
};

exports.desalocar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { observacao } = req.body ?? {};

    const [atual] = await conn.execute(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!atual.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });
    
    const eq = atual[0];
    if (eq.status !== 'alocado') return res.status(400).json({ message: 'Equipamento não está alocado para ser devolvido.' });

    const usuario = usuarioReq(req);
    await conn.beginTransaction();
    await conn.execute(`UPDATE equipamentos SET status='disponivel', colaborador_atual_id=NULL WHERE id=?`, [id]);
    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, colaborador_id, usuario) VALUES (?, 'DESALOCACAO', ?, 'alocado', 'disponivel', ?, ?)`,
      [id, observacao || 'Devolução do equipamento', eq.colaborador_atual_id ?? null, usuario]
    );

    await conn.commit();
    await registarAuditoriaGlobal(usuario, 'DESALOCAÇÃO', id, req.body);
    res.json({ message: 'Equipamento desalocado com sucesso.' });
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao desalocar equipamento.' });
  } finally {
    conn.release();
  }
};

exports.remover = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const [atual] = await conn.execute(`SELECT * FROM equipamentos WHERE id = ?`, [id]);
    if (!atual.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });

    const usuario = usuarioReq(req);
    await conn.beginTransaction();
    await conn.execute(`UPDATE equipamentos SET status='inativo', colaborador_atual_id=NULL WHERE id=?`, [id]);
    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, usuario) VALUES (?, 'BAIXA', 'Inativação do equipamento', ?, 'inativo', ?)`,
      [id, atual[0].status, usuario]
    );

    await conn.commit();
    await registarAuditoriaGlobal(usuario, 'INATIVAÇÃO', id, { status: 'inativo' });
    res.json({ message: 'Equipamento inativado com sucesso.' });
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao inativar equipamento.' });
  } finally {
    conn.release();
  }
};

exports.historico = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await q(
      `SELECT h.*, c.nome AS colaborador_nome FROM historico_equipamentos h LEFT JOIN colaboradores c ON c.id = h.colaborador_id WHERE h.equipamento_id = ? ORDER BY h.data_hora DESC, h.id DESC`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar histórico.' });
  }
};

exports.excluir = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const [rows] = await conn.execute(`SELECT id, status FROM equipamentos WHERE id = ?`, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: 'Equipamento não encontrado.' });
    
    if (rows[0].status !== 'inativo') return res.status(400).json({ message: 'Inative o equipamento antes de excluir definitivamente.' });

    const usuario = usuarioReq(req);
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM historico_equipamentos WHERE equipamento_id = ?`, [id]);
    await conn.execute(`DELETE FROM equipamentos WHERE id = ?`, [id]);
    await conn.commit();
    
    await registarAuditoriaGlobal(usuario, 'EXCLUSÃO', id, { excluido: true });
    return res.json({ message: 'Equipamento excluído definitivamente.' });
  } catch (err) {
    await (conn?.rollback?.());
    console.error('Erro ao excluir definitivamente:', err);
    return res.status(500).json({ message: 'Erro ao excluir equipamento.' });
  } finally {
    conn.release();
  }
};

exports.exportarCsv = async (req, res) => {
  try {
    const { q: termo = '', status, sortBy = 'created_at', sortDir = 'desc' } = req.query;
    const allowedSort = new Set(['id','tipo','marca','modelo','numero_serie','patrimonio','status','created_at','colaborador_nome']);
    const by = allowedSort.has(String(sortBy)) ? String(sortBy) : 'created_at';
    const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const orderExpr = by === 'colaborador_nome' ? 'c.nome' : `e.${by}`;
    const { where, params } = buildFiltro({ termo, status });

    const sql = `
      SELECT e.id, e.tipo, e.marca, e.modelo, e.numero_serie, e.patrimonio, e.status, e.created_at, e.observacoes, c.nome AS colaborador_nome
      FROM equipamentos e LEFT JOIN colaboradores c ON c.id = e.colaborador_atual_id ${where} ORDER BY ${orderExpr} ${dir}`;
    const [rows] = await db.execute(sql, params);

    const header = ['ID','Tipo','Marca','Modelo','Série','Patrimônio','Status','Colaborador','Criado_em','Observacoes'];
    const lines = rows.map(r => ([
      r.id, r.tipo || '', r.marca || '', r.modelo || '', r.numero_serie || '', r.patrimonio || '', r.status || '', r.colaborador_nome || '',
      r.created_at ? new Date(r.created_at).toISOString() : '', r.observacoes || ''
    ].map(val => {
      const s = String(val ?? '');
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(';')));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="equipamentos.csv"');
    res.status(200).send([header.join(';'), ...lines].join('\n'));
  } catch (err) {
    console.error(err);
    res.status(500).send('Falha ao exportar CSV.');
  }
};