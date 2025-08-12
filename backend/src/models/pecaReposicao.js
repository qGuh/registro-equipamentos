const db = require('../config/database');

const PecaReposicao = {
  listar: async () => {
    const [rows] = await db.query('SELECT * FROM pecas_reposicao');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM pecas_reposicao WHERE id = ?', [id]);
    return rows[0];
  },

  criar: async (dados) => {
    const { nome, codigo, descricao, quantidade_estoque, local_armazenado } = dados;
    const [resultado] = await db.query(
      `INSERT INTO pecas_reposicao (nome, codigo, descricao, quantidade_estoque, local_armazenado)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, codigo, descricao, quantidade_estoque, local_armazenado]
    );
    return resultado.insertId;
  },

  atualizar: async (id, dados) => {
    const { nome, codigo, descricao, quantidade_estoque, local_armazenado } = dados;
    const [resultado] = await db.query(
      `UPDATE pecas_reposicao
       SET nome = ?, codigo = ?, descricao = ?, quantidade_estoque = ?, local_armazenado = ?
       WHERE id = ?`,
      [nome, codigo, descricao, quantidade_estoque, local_armazenado, id]
    );
    return resultado.affectedRows > 0;
  },

  excluir: async (id) => {
    const [resultado] = await db.query('DELETE FROM pecas_reposicao WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = PecaReposicao;