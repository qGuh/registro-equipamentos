const db = require('../config/database');

const MovimentacaoPeca = {
  listar: async () => {
    const [rows] = await db.query('SELECT * FROM movimentacao_pecas WHERE status != "inativo"');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM movimentacao_pecas WHERE id = ?', [id]);
    return rows[0];
  },

  criar: async (dados) => {
    const {
      id_peca, tipo_movimentacao, quantidade, data_movimentacao, motivo,
      referencia_manutencao, responsavel, observacoes
    } = dados;

    const [resultado] = await db.query(
      `INSERT INTO movimentacao_pecas
       (id_peca, tipo_movimentacao, quantidade, data_movimentacao, motivo,
        referencia_manutencao, responsavel, observacoes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_peca, tipo_movimentacao, quantidade, data_movimentacao, motivo,
       referencia_manutencao, responsavel, observacoes, 'ativo']
    );
    return resultado.insertId;
  },

  atualizar: async (id, dados) => {
    const {
      id_peca, tipo_movimentacao, quantidade, data_movimentacao, motivo,
      referencia_manutencao, responsavel, observacoes, status
    } = dados;

    const [resultado] = await db.query(
      `UPDATE movimentacao_pecas
       SET id_peca = ?, tipo_movimentacao = ?, quantidade = ?, data_movimentacao = ?, motivo = ?,
           referencia_manutencao = ?, responsavel = ?, observacoes = ?, status = ?
       WHERE id = ?`,
      [id_peca, tipo_movimentacao, quantidade, data_movimentacao, motivo,
       referencia_manutencao, responsavel, observacoes, status, id]
    );
    return resultado.affectedRows > 0;
  },

  excluir: async (id) => {
    const [resultado] = await db.query('DELETE FROM movimentacao_pecas WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = MovimentacaoPeca;