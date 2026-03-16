const db = require('../config/database');

// -------------------------------------------------------------
// Helpers de Banco de Dados e Auditoria
// -------------------------------------------------------------
async function run(sql, params = []) {
  if (db && typeof db.query === 'function') return db.query(sql, params);
  if (db?.pool && typeof db.pool.query === 'function') return db.pool.query(sql, params);
  if (db && typeof db.execute === 'function') return db.execute(sql, params);
  if (db?.pool && typeof db.pool.execute === 'function') return db.pool.execute(sql, params);
  throw new Error('DB connector não expõe query/execute.');
}

async function registarAuditoria(usuario, acao, id_registro, detalhes) {
  try {
    await run(
      `INSERT INTO log_auditoria (usuario, acao, tabela_afetada, id_registro, data_hora, detalhes) 
       VALUES (?, ?, 'colaboradores', ?, NOW(), ?)`,
      [usuario || 'Sistema', acao, id_registro, JSON.stringify(detalhes)]
    );
  } catch (err) {
    console.error('Erro ao gravar log de auditoria:', err);
  }
}

// -------------------------------------------------------------
// Controladores Principais
// -------------------------------------------------------------

exports.listar = async (req, res) => {
  try {
    const { q, limit } = req.query;

    let L = Number(limit);
    if (!Number.isFinite(L) || L <= 0) L = 20;
    if (L > 50) L = 50;

    if (q && String(q).trim() !== '') {
      const like = `%${String(q).trim()}%`;
      const sql = `SELECT id, nome FROM colaboradores WHERE nome LIKE ? ORDER BY nome ASC LIMIT ${L}`;
      const [rows] = await run(sql, [like]);
      return res.json(rows);
    }

    // lista completa
    const [rows] = await run(`SELECT * FROM colaboradores ORDER BY id DESC`);
    return res.json(rows);
  } catch (err) {
    console.error("Erro no listar colaboradores:", err);
    return res.status(500).json({ message: 'Erro ao listar colaboradores.', detail: err.message });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await run(`SELECT * FROM colaboradores WHERE id = ? LIMIT 1`, [id]);
    
    if (!rows.length) return res.status(404).json({ message: 'Colaborador não encontrado' });
    
    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao buscar colaborador', detail: err.message });
  }
};

exports.criar = async (req, res) => {
  try {
    const body = req.body || {};
    const nome = body.nome || null;
    const email = body.email || null;
    // ✅ Trocado: matricula -> telefone_corporativo
    const telefone_corporativo = body.telefone_corporativo || body.telefone || null;
    const setor = body.setor || null;
    const cargo = body.cargo || null;
    const data_admissao = body.data_admissao || null;
    
    const statusPermitidos = ['ativo', 'inativo', 'ferias', 'afastado', 'desligado'];
    let status = String(body.status || 'ativo').toLowerCase();
    if (!statusPermitidos.includes(status)) status = 'ativo';

    // ✅ Trocado na Query SQL
    const [result] = await run(
      `INSERT INTO colaboradores (nome, email, telefone_corporativo, setor, cargo, data_admissao, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, email, telefone_corporativo, setor, cargo, data_admissao, status]
    );

    const novoId = result.insertId;
    const nomeUsuario = req.user?.nome || req.usuario?.nome || body.usuario || 'Sistema';
    
    await registarAuditoria(nomeUsuario, 'INSERÇÃO', novoId, body);

    return res.status(201).json({ id: novoId, message: 'Colaborador criado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno ao criar colaborador', detail: err.message });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    
    const nome = body.nome || null;
    const email = body.email || null;
    // ✅ Trocado: matricula -> telefone_corporativo
    const telefone_corporativo = body.telefone_corporativo || body.telefone || null;
    const setor = body.setor || null;
    const cargo = body.cargo || null;
    const data_admissao = body.data_admissao || null;
    
    const statusPermitidos = ['ativo', 'inativo', 'ferias', 'afastado', 'desligado'];
    let status = String(body.status || 'ativo').toLowerCase();
    if (!statusPermitidos.includes(status)) status = 'ativo';

    // ✅ Trocado na Query SQL
    const [result] = await run(
      `UPDATE colaboradores SET nome = ?, email = ?, telefone_corporativo = ?, setor = ?, cargo = ?, data_admissao = ?, status = ? 
       WHERE id = ?`,
      [nome, email, telefone_corporativo, setor, cargo, data_admissao, status, id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: 'Colaborador não encontrado' });

    const nomeUsuario = req.user?.nome || req.usuario?.nome || body.usuario || 'Sistema';
    await registarAuditoria(nomeUsuario, 'ATUALIZAÇÃO', id, body);

    return res.json({ message: 'Colaborador atualizado com sucesso' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno ao atualizar colaborador', detail: err.message });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await run(`DELETE FROM colaboradores WHERE id = ?`, [id]);
    
    if (!result.affectedRows) return res.status(404).json({ message: 'Colaborador não encontrado' });

    const nomeUsuario = req.user?.nome || req.usuario?.nome || 'Sistema';
    await registarAuditoria(nomeUsuario, 'EXCLUSÃO', id, { excluido: true });

    return res.json({ message: 'Colaborador removido com sucesso' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno ao excluir colaborador', detail: err.message });
  }
};