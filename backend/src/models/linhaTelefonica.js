const db = require('../config/database');

const LinhaTelefonica = {
  listar: async () => {
    const [rows] = await db.query('SELECT * FROM linhas_telefonicas');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM linhas_telefonicas WHERE id = ?', [id]);
    return rows[0];
  },

  criar: async (dados) => {
    const { numero, operadora, plano, status, observacao } = dados;
    const [resultado] = await db.query(
      `INSERT INTO linhas_telefonicas (numero, operadora, plano, status, observacao)
       VALUES (?, ?, ?, ?, ?)`,
      [numero, operadora, plano, status, observacao]
    );
    return resultado.insertId;
  },

  atualizar: async (id, dados) => {
    const { numero, operadora, plano, status, observacao } = dados;
    const [resultado] = await db.query(
      `UPDATE linhas_telefonicas
       SET numero = ?, operadora = ?, plano = ?, status = ?, observacao = ?
       WHERE id = ?`,
      [numero, operadora, plano, status, observacao, id]
    );
    return resultado.affectedRows > 0;
  },

  excluir: async (id) => {
    const [resultado] = await db.query('DELETE FROM linhas_telefonicas WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = LinhaTelefonica;