const db = require('../config/database');

const AcessoTi = {
  listar: async () => {
    const [rows] = await db.query('SELECT * FROM acessos_ti');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM acessos_ti WHERE id = ?', [id]);
    return rows[0];
  },

  criar: async (dados) => {
    const { sistema, login, senha, observacao } = dados;
    const [resultado] = await db.query(
      `INSERT INTO acessos_ti (sistema, login, senha, observacao)
       VALUES (?, ?, ?, ?)`,
      [sistema, login, senha, observacao]
    );
    return resultado.insertId;
  },

  atualizar: async (id, dados) => {
    const { sistema, login, senha, observacao } = dados;
    const [resultado] = await db.query(
      `UPDATE acessos_ti
       SET sistema = ?, login = ?, senha = ?, observacao = ?
       WHERE id = ?`,
      [sistema, login, senha, observacao, id]
    );
    return resultado.affectedRows > 0;
  },

  excluir: async (id) => {
    const [resultado] = await db.query('DELETE FROM acessos_ti WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = AcessoTi;