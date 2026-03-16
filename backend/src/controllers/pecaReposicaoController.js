// src/controllers/pecaReposicaoController.js
const db = require('../config/database'); // mysql2/promise pool

// Helpers
async function q(sql, params = []) { const [rows] = await db.execute(sql, params); return rows; }

const toNull = (v) =>
  (v === undefined || v === null || (typeof v === 'string' && v.trim() === ''))
    ? null : v;

function buildFiltro({ termo }) {
  const filtros = []; const params = [];
  if (termo) {
    filtros.push(`(
      p.nome LIKE ? OR p.descricao LIKE ? OR p.categoria LIKE ? OR p.local_armazenamento LIKE ?
    )`);
    for (let i = 0; i < 4; i++) params.push(`%${termo}%`);
  }
  const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
  return { where, params };
}

// GET /api/pecas?q=&page=&pageSize=&sortBy=&sortDir=
exports.listar = async (req, res) => {
  try {
    const {
      q: termo = '',
      page = 1,
      pageSize = 10,
      sortBy = 'nome',
      sortDir = 'asc'
    } = req.query;

    const PAGE = Math.max(parseInt(page) || 1, 1);
    const SIZE = Math.min(Math.max(parseInt(pageSize) || 10, 1), 100);
    const allowedSort = new Set(['id', 'nome', 'categoria', 'local_armazenamento', 'quantidade']);
    const by  = allowedSort.has(String(sortBy)) ? String(sortBy) : 'nome';
    const dir = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const offset = (PAGE - 1) * SIZE;

    const { where, params } = buildFiltro({ termo });

    const [cnt] = await db.execute(`SELECT COUNT(*) AS total FROM pecas_reposicao p ${where}`, params);
    const total = cnt[0]?.total || 0;

    const sql = `
      SELECT p.*
        FROM pecas_reposicao p
       ${where}
       ORDER BY p.${by} ${dir}
       LIMIT ${SIZE} OFFSET ${offset}`;
    const [rows] = await db.execute(sql, params);

    res.json({ items: rows, page: PAGE, pageSize: SIZE, total, totalPages: Math.ceil(total / SIZE) || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar peças.' });
  }
};

// GET /api/pecas/export?q=&sortBy=&sortDir=
exports.exportarCsv = async (req, res) => {
  try {
    const { q: termo = '', sortBy = 'nome', sortDir = 'asc' } = req.query;
    const allowedSort = new Set(['id', 'nome', 'categoria', 'local_armazenamento', 'quantidade']);
    const by  = allowedSort.has(String(sortBy)) ? String(sortBy) : 'nome';
    const dir = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const { where, params } = buildFiltro({ termo });

    const sql = `
      SELECT p.id, p.nome, p.categoria, p.local_armazenamento, p.quantidade, p.descricao, p.observacoes
        FROM pecas_reposicao p
       ${where}
       ORDER BY p.${by} ${dir}`;
    const [rows] = await db.execute(sql, params);

    const header = ['ID', 'Nome', 'Categoria', 'Local', 'Quantidade', 'Descrição', 'Observações'];
    const lines = rows.map(r => ([
      r.id, r.nome || '', r.categoria || '', r.local_armazenamento || '',
      r.quantidade ?? 0, r.descricao || '', r.observacoes || ''
    ].map(v => {
      const s = String(v ?? '');
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(';')));

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pecas.csv"');
    res.status(200).send([header.join(';'), ...lines].join('\n'));
  } catch (err) {
    console.error(err);
    res.status(500).send('Falha ao exportar CSV.');
  }
};

// GET /api/pecas/:id
exports.obterPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await q(`SELECT * FROM pecas_reposicao WHERE id=?`, [id]);
    if (!rows.length) return res.status(404).json({ message: 'Peça não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar peça.' });
  }
};

// POST /api/pecas
exports.criar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const b = req.body ?? {};
    const nome  = (b.nome || '').trim();
    if (!nome) return res.status(400).json({ message: "Campo 'nome' é obrigatório." });

    const descricao           = toNull(b.descricao);
    const categoria           = toNull(b.categoria);
    const quantidade          = Number.isFinite(Number(b.quantidade)) ? Number(b.quantidade) : 0;
    const local_armazenamento = toNull(b.local_armazenamento);
    const observacoes         = toNull(b.observacoes);

    await conn.beginTransaction();
    const [r] = await conn.execute(
      `INSERT INTO pecas_reposicao (nome, descricao, categoria, quantidade, local_armazenamento, observacoes)
       VALUES (?,?,?,?,?,?)`,
      [nome, descricao, categoria, quantidade, local_armazenamento, observacoes]
    );
    await conn.commit();

    const [created] = await conn.execute(`SELECT * FROM pecas_reposicao WHERE id=?`, [r.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar peça.' });
  } finally {
    conn.release();
  }
};

// PUT /api/pecas/:id
exports.atualizar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const atual = await q(`SELECT * FROM pecas_reposicao WHERE id=?`, [id]);
    if (!atual.length) return res.status(404).json({ message: 'Peça não encontrada.' });

    const nome  = (req.body.nome ?? atual[0].nome | '').trim();
    if (!nome) return res.status(400).json({ message: "Campo 'nome' é obrigatório." });

    const descricao           = toNull(req.body.descricao           ?? atual[0].descricao);
    const categoria           = toNull(req.body.categoria           ?? atual[0].categoria);
    const quantidade          = Number.isFinite(Number(req.body.quantidade ?? atual[0].quantidade))
                                  ? Number(req.body.quantidade ?? atual[0].quantidade) : 0;
    const local_armazenamento = toNull(req.body.local_armazenamento ?? atual[0].local_armazenamento);
    const observacoes         = toNull(req.body.observacoes         ?? atual[0].observacoes);

    await conn.beginTransaction();
    await conn.execute(
      `UPDATE pecas_reposicao
          SET nome=?, descricao=?, categoria=?, quantidade=?, local_armazenamento=?, observacoes=?
        WHERE id=?`,
      [nome, descricao, categoria, quantidade, local_armazenamento, observacoes, id]
    );
    await conn.commit();

    const [updated] = await conn.execute(`SELECT * FROM pecas_reposicao WHERE id=?`, [id]);
    res.json(updated[0]);
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar peça.' });
  } finally {
    conn.release();
  }
};

// DELETE /api/pecas/:id  (exclusão definitiva, bloqueia se houver movimentações)
exports.remover = async (req, res) => {
  try {
    const { id } = req.params;
    const [mCnt] = await db.execute(`SELECT COUNT(*) AS total FROM movimentacao_pecas WHERE id_peca=?`, [id]);
    if ((mCnt[0]?.total || 0) > 0) {
      return res.status(400).json({ message: 'Peça possui movimentações e não pode ser excluída.' });
    }
    const r = await q(`DELETE FROM pecas_reposicao WHERE id=?`, [id]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Peça não encontrada.' });
    res.json({ message: 'Peça excluída com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao excluir peça.' });
  }
};