// backend/src/controllers/contaAcessoController.js
const db = require('../config/database');

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
  const p = String(req.user?.perfil || '').toLowerCase();
  return p === 'admin' || p === 'administrador';
}

async function resolveColaboradorId(raw) {
  if (raw === undefined || raw === null) return null;

  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;

  const s = String(raw).trim();
  if (!s) return null;

  if (/^\d+$/.test(s)) return parseInt(s, 10);

  let [rows] = await run(
    `SELECT id FROM colaboradores WHERE LOWER(nome) = LOWER(?) LIMIT 1`,
    [s]
  );
  if (rows?.length) return rows[0].id;

  [rows] = await run(`SELECT id FROM colaboradores WHERE nome LIKE ? LIMIT 1`, [`%${s}%`]);
  if (rows?.length) return rows[0].id;

  return null;
}

exports.listar = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const setor = (req.query.setor || '').trim();
    const categoria = (req.query.categoria || '').trim();

    const page = Math.max(1, toInt(req.query.page, 1));
    const pageSize = Math.min(100, Math.max(1, toInt(req.query.pageSize, 10)));
    const offset = (page - 1) * pageSize;

    const conditions = [];
    const params = [];

    if (q) {
      const like = `%${q}%`;
      conditions.push(`(
        ca.plataforma LIKE ? OR
        ca.login LIKE ? OR
        ca.categoria LIKE ? OR
        c.nome LIKE ? OR
        c.setor LIKE ?
      )`);
      params.push(like, like, like, like, like);
    }

    if (setor) {
      conditions.push(`c.setor = ?`);
      params.push(setor);
    }

    if (categoria) {
      conditions.push(`ca.categoria = ?`);
      params.push(categoria);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countRows] = await run(
      `
      SELECT COUNT(*) AS total
      FROM contas_acesso ca
      LEFT JOIN colaboradores c ON c.id = ca.id_colaborador
      ${where}
      `,
      params
    );

    const total = Number(countRows?.[0]?.total || 0);

    const [rows] = await run(
      `
      SELECT
        ca.id,
        ca.plataforma,
        ca.login,
        ca.categoria,
        ca.id_colaborador AS colaborador_id,
        c.nome AS colaborador_nome,
        c.setor AS setor,
        ca.status,
        ca.ultima_atualizacao
      FROM contas_acesso ca
      LEFT JOIN colaboradores c ON c.id = ca.id_colaborador
      ${where}
      ORDER BY ca.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, Number(pageSize), Number(offset)]
    );

    return res.json({ items: rows, total, page, pageSize });
  } catch (err) {
    console.error('ERRO /api/contas (listar):', err);
    return res.status(500).json({
      message: 'Erro interno do servidor',
      detail: err?.sqlMessage || err?.message || String(err),
    });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await run(
      `
      SELECT
        ca.*,
        ca.id_colaborador AS colaborador_id,
        c.nome AS colaborador_nome,
        c.setor AS setor
      FROM contas_acesso ca
      LEFT JOIN colaboradores c ON c.id = ca.id_colaborador
      WHERE ca.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Conta não encontrada' });

    const row = rows[0];

    // ✅ senha só admin
    if (!isAdmin(req)) {
      delete row.senha;
    }

    return res.json(row);
  } catch (err) {
    console.error('ERRO /api/contas/:id (buscarPorId):', err);
    return res.status(500).json({
      message: 'Erro interno do servidor',
      detail: err?.sqlMessage || err?.message || String(err),
    });
  }
};

exports.criar = async (req, res) => {
  try {
    const body = req.body || {};

    const plataforma = body.sistema || body.plataforma || null;
    const login = body.login || null;
    const senha = body.senha || null;
    const categoria = body.categoria || null;

    const id_colaborador = await resolveColaboradorId(body.colaborador_id ?? body.id_colaborador);

    const status = body.status || 'ativo';

    if (!plataforma) {
      return res.status(400).json({ message: 'Campo "sistema/plataforma" é obrigatório.' });
    }

    const [result] = await run(
      `
      INSERT INTO contas_acesso
      (plataforma, login, senha, categoria, id_colaborador, status, ultima_atualizacao)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      `,
      [plataforma, login, senha, categoria, id_colaborador, status]
    );

    return res.status(201).json({ id: result.insertId, message: 'Conta criada com sucesso.' });
  } catch (err) {
    console.error('ERRO /api/contas (criar):', err);
    return res.status(500).json({
      message: 'Erro interno do servidor',
      detail: err?.sqlMessage || err?.message || String(err),
    });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const plataforma = body.sistema || body.plataforma || null;
    const login = body.login || null;
    const senha = body.senha || null;
    const categoria = body.categoria || null;

    const id_colaborador = await resolveColaboradorId(body.colaborador_id ?? body.id_colaborador);

    const status = body.status || 'ativo';

    if (!plataforma) {
      return res.status(400).json({ message: 'Campo "sistema/plataforma" é obrigatório.' });
    }

    const [result] = await run(
      `
      UPDATE contas_acesso
      SET
        plataforma = ?,
        login = ?,
        senha = ?,
        categoria = ?,
        id_colaborador = ?,
        status = ?,
        ultima_atualizacao = NOW()
      WHERE id = ?
      `,
      [plataforma, login, senha, categoria, id_colaborador, status, id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Conta não encontrada' });
    }

    return res.json({ message: 'Conta atualizada com sucesso.' });
  } catch (err) {
    console.error('ERRO /api/contas/:id (atualizar):', err);
    return res.status(500).json({
      message: 'Erro interno do servidor',
      detail: err?.sqlMessage || err?.message || String(err),
    });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await run(`DELETE FROM contas_acesso WHERE id = ?`, [id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Conta não encontrada' });
    }

    return res.json({ message: 'Conta excluída com sucesso.' });
  } catch (err) {
    console.error('ERRO /api/contas/:id (excluir):', err);
    return res.status(500).json({
      message: 'Erro interno do servidor',
      detail: err?.sqlMessage || err?.message || String(err),
    });
  }
};