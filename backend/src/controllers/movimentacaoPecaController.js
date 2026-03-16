// src/controllers/movimentacaoPecaController.js
const db = require('../config/database');

async function q(sql, params = []) { const [rows] = await db.execute(sql, params); return rows; }

function usuarioReq(req) {
  if (req.user?.login) return req.user.login;
  if (req.user?.nome)  return req.user.nome;
  if (req.user?.id)    return `user#${req.user.id}`;
  return 'sistema';
}

// GET /api/pecas/:id/movimentacoes?page=&pageSize=
exports.listar = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;

    const PAGE = Math.max(parseInt(page) || 1, 1);
    const SIZE = Math.min(Math.max(parseInt(pageSize) || 10, 1), 100);
    const offset = (PAGE - 1) * SIZE;

    const [cnt] = await db.execute(
      `SELECT COUNT(*) AS total FROM movimentacao_pecas WHERE id_peca=?`, [id]
    );
    const total = cnt[0]?.total || 0;

    const sql = `
      SELECT mp.*
        FROM movimentacao_pecas mp
       WHERE mp.id_peca = ?
       ORDER BY mp.data_hora DESC, mp.id DESC
       LIMIT ${SIZE} OFFSET ${offset}`;
    const [rows] = await db.execute(sql, [id]);

    res.json({ items: rows, page: PAGE, pageSize: SIZE, total, totalPages: Math.ceil(total / SIZE) || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar movimentações.' });
  }
};

/*
  POST /api/pecas/:id/movimentar
  body: { tipo: 'entrada'|'saida'|'ajuste', quantidade, valor_unitario?, observacao?, id_manutencao? }
*/
exports.movimentar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const b = req.body ?? {};

    const tipo = String(b.tipo || '').toLowerCase();
    const quantidade = Number(b.quantidade);
    if (!['entrada','saida','ajuste'].includes(tipo)) {
      return res.status(400).json({ message: 'Tipo inválido.' });
    }
    if (!Number.isFinite(quantidade) || quantidade === 0) {
      return res.status(400).json({ message: 'Quantidade inválida.' });
    }

    const valor_unitario = b.valor_unitario != null ? Number(b.valor_unitario) : null;
    const observacao = b.observacao || null;
    const id_manutencao = b.id_manutencao ? Number(b.id_manutencao) : null;

    const pecas = await q(`SELECT * FROM pecas_reposicao WHERE id=?`, [id]);
    if (!pecas.length) return res.status(404).json({ message: 'Peça não encontrada.' });

    let novo = Number(pecas[0].quantidade || 0);
    if (tipo === 'entrada') novo += Math.abs(quantidade);
    if (tipo === 'saida')   novo -= Math.abs(quantidade);
    if (tipo === 'ajuste')  novo += quantidade; // pode ser negativo/positivo

    if (novo < 0) return res.status(400).json({ message: 'Estoque insuficiente.' });

    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO movimentacao_pecas
        (id_peca, id_manutencao, tipo, quantidade, valor_unitario, observacao, usuario, data_hora)
       VALUES (?,?,?,?,?,?,?, NOW())`,
      [id, id_manutencao, tipo, quantidade, valor_unitario, observacao, usuarioReq(req)]
    );

    await conn.execute(`UPDATE pecas_reposicao SET quantidade=? WHERE id=?`, [novo, id]);

    await conn.commit();
    res.json({ message: 'Movimentação registrada.', quantidade_atual: novo });
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao movimentar peça.' });
  } finally {
    conn.release();
  }
};