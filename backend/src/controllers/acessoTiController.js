const db = require('../config/database');

// -------------------------------------------------------------
// Helpers de Banco de Dados e Validação
// -------------------------------------------------------------
async function run(sql, params = []) {
  if (db && typeof db.query === 'function') return db.query(sql, params);
  if (db?.pool && typeof db.pool.query === 'function') return db.pool.query(sql, params);
  if (db && typeof db.execute === 'function') return db.execute(sql, params);
  if (db?.pool && typeof db.pool.execute === 'function') return db.pool.execute(sql, params);
  throw new Error('DB connector não expõe query/execute.');
}

function toInt(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

function isAdmin(req) {
  const p = String(req.user?.perfil || req.usuario?.tipo_perfil || '').toLowerCase();
  return p === 'admin' || p === 'administrador';
}

async function resolveColaboradorId(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return parseInt(s, 10);

  let [rows] = await run(`SELECT id FROM colaboradores WHERE LOWER(nome) = LOWER(?) LIMIT 1`, [s]);
  if (rows?.length) return rows[0].id;

  [rows] = await run(`SELECT id FROM colaboradores WHERE nome LIKE ? LIMIT 1`, [`%${s}%`]);
  if (rows?.length) return rows[0].id;

  return null;
}

async function registarAuditoria(usuario, acao, id_registro, detalhes) {
  try {
    await run(
      `INSERT INTO log_auditoria (usuario, acao, tabela_afetada, id_registro, data_hora, detalhes) 
       VALUES (?, ?, 'acessos_ti', ?, NOW(), ?)`,
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
    const q = (req.query.q || '').trim();
    const categoria = (req.query.categoria || '').trim();
    const page = Math.max(1, toInt(req.query.page, 1));
    const pageSize = Math.min(100, Math.max(1, toInt(req.query.pageSize, 10)));
    const offset = (page - 1) * pageSize;

    const conditions = [];
    const params = [];

    if (q) {
      const like = `%${q}%`;
      conditions.push(`(a.descricao LIKE ? OR a.login LIKE ? OR a.tipo LIKE ? OR c.nome LIKE ?)`);
      params.push(like, like, like, like);
    }

    if (categoria) {
      conditions.push(`a.categoria = ?`);
      params.push(categoria);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await run(
      `SELECT COUNT(*) AS total FROM acessos_ti a LEFT JOIN colaboradores c ON c.id = a.id_colaborador ${where}`,
      params
    );
    const total = Number(countRows?.[0]?.total || 0);

    // ✅ CORREÇÃO 1: "a.senha_criptografada AS senha" para o frontend reconhecer
    // ✅ CORREÇÃO 2: "c.nome AS colaborador" para alimentar a coluna
    // ✅ CORREÇÃO 3: DATE_FORMAT para limpar a data feia
    const [rows] = await run(
      `SELECT 
        a.id, a.tipo, a.descricao AS plataforma, a.descricao, a.url, a.login, a.categoria, a.status, a.observacoes,
        a.senha_criptografada AS senha,
        DATE_FORMAT(a.ultima_atualizacao, '%Y-%m-%d') AS ultima_atualizacao,
        a.id_colaborador AS colaborador_id, c.nome AS colaborador_nome, c.nome AS colaborador, c.setor AS setor
      FROM acessos_ti a
      LEFT JOIN colaboradores c ON c.id = a.id_colaborador
      ${where}
      ORDER BY a.id DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), Number(offset)]
    );

    // Segurança: remove a senha da resposta se não for admin
    if (!isAdmin(req)) {
      rows.forEach(r => delete r.senha);
    }

    return res.json({ items: rows, total, page, pageSize });
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno do servidor', detail: err.message });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await run(
      `SELECT a.*, a.descricao AS plataforma, a.senha_criptografada AS senha, 
              c.nome AS colaborador_nome, c.nome AS colaborador, c.setor AS setor 
       FROM acessos_ti a LEFT JOIN colaboradores c ON c.id = a.id_colaborador WHERE a.id = ? LIMIT 1`,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Acesso não encontrado.' });

    const row = rows[0];
    if (!isAdmin(req)) {
      delete row.senha_criptografada;
      delete row.senha;
      delete row.token_api;
    }

    return res.json(row);
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno do servidor', detail: err.message });
  }
};

exports.criar = async (req, res) => {
  try {
    const body = req.body || {};
    const descricao = body.sistema || body.plataforma || body.descricao || body.servico || null;
    const tipo = body.tipo || null;
    const url = body.url || null;
    const login = body.login || body.email || body.usuario || null;
    const senha_criptografada = body.senha || body.senha_criptografada || null;
    const categoria = body.categoria || null;
    const status = body.status || 'ativo';
    const observacoes = body.observacao || body.observacoes || null;
    
    // ✅ CORREÇÃO 4: Adicionado "body.colaborador" na busca para garantir o vínculo!
    const id_colaborador = await resolveColaboradorId(body.colaborador_id ?? body.id_colaborador ?? body.colaborador);

    if (!descricao) return res.status(400).json({ message: 'O campo Sistema/Serviço é obrigatório.' });

    const [result] = await run(
      `INSERT INTO acessos_ti (tipo, descricao, url, login, senha_criptografada, categoria, id_colaborador, status, ultima_atualizacao, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
      [tipo, descricao, url, login, senha_criptografada, categoria, id_colaborador, status, observacoes]
    );

    await registarAuditoria(req.user?.nome || req.usuario?.nome || 'Desconhecido', 'INSERÇÃO', result.insertId, body);
    return res.status(201).json({ id: result.insertId, message: 'Acesso criado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno do servidor', detail: err.message });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    
    const descricao = body.sistema || body.plataforma || body.descricao || body.servico || null;
    const tipo = body.tipo || null;
    const url = body.url || null;
    const login = body.login || body.email || body.usuario || null;
    const senha_criptografada = body.senha || body.senha_criptografada || null;
    const categoria = body.categoria || null;
    const status = body.status || 'ativo';
    const observacoes = body.observacao || body.observacoes || null;

    // ✅ CORREÇÃO 4: Garantindo o vínculo também na atualização
    const id_colaborador = await resolveColaboradorId(body.colaborador_id ?? body.id_colaborador ?? body.colaborador);

    if (!descricao) return res.status(400).json({ message: 'O campo Sistema/Serviço é obrigatório.' });

    const [result] = await run(
      `UPDATE acessos_ti SET 
        tipo = ?, descricao = ?, url = ?, login = ?, senha_criptografada = ?, 
        categoria = ?, id_colaborador = ?, status = ?, ultima_atualizacao = CURDATE(), observacoes = ?
       WHERE id = ?`,
      [tipo, descricao, url, login, senha_criptografada, categoria, id_colaborador, status, observacoes, id]
    );

    if (!result.affectedRows) return res.status(404).json({ message: 'Acesso não encontrado.' });
    await registarAuditoria(req.user?.nome || req.usuario?.nome || 'Desconhecido', 'ATUALIZAÇÃO', id, body);
    return res.json({ message: 'Acesso atualizado com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno do servidor', detail: err.message });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await run(`DELETE FROM acessos_ti WHERE id = ?`, [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Acesso não encontrado.' });
    await registarAuditoria(req.user?.nome || req.usuario?.nome || 'Desconhecido', 'EXCLUSÃO', id, { excluido: true });
    return res.json({ message: 'Acesso excluído com sucesso.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro interno do servidor', detail: err.message });
  }
};