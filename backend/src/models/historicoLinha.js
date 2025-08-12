const db = require('../config/database');

const HistoricoLinha = {
  listar: async () => {
    const [rows] = await db.query('SELECT * FROM historico_linhas');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM historico_linhas WHERE id = ?', [id]);
    return rows[0];
  },

  criar: async (dados) => {
    const { linha_id, colaborador_id, data_inicio, data_fim, observacao } = dados;
    const [resultado] = await db.query(
      `INSERT INTO historico_linhas (linha_id, colaborador_id, data_inicio, data_fim, observacao)
       VALUES (?, ?, ?, ?, ?)`,
      [linha_id, colaborador_id, data_inicio, data_fim, observacao]
    );
    return resultado.insertId;
  },

  atualizar: async (id, dados) => {
    const { linha_id, colaborador_id, data_inicio, data_fim, observacao } = dados;
    const [resultado] = await db.query(
      `UPDATE historico_linhas
       SET linha_id = ?, colaborador_id = ?, data_inicio = ?, data_fim = ?, observacao = ?
       WHERE id = ?`,
      [linha_id, colaborador_id, data_inicio, data_fim, observacao, id]
    );
    return resultado.affectedRows > 0;
  },

  excluir: async (id) => {
    const [resultado] = await db.query('DELETE FROM historico_linhas WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = HistoricoLinha;