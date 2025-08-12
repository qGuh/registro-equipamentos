const db = require('../config/database');

const Colaborador = {
  listar: async () => {
    const [rows] = await db.query('SELECT * FROM colaboradores WHERE status != "inativo"');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM colaboradores WHERE id = ?', [id]);
    return rows[0];
  },

  criar: async (dados) => {
    const { nome, email, matricula, setor, cargo, data_admissao } = dados;
    const [resultado] = await db.query(
      `INSERT INTO colaboradores (nome, email, matricula, setor, cargo, data_admissao, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome, email, matricula, setor, cargo, data_admissao, 'ativo']
    );
    return resultado.insertId;
  },

  atualizar: async (id, dados) => {
    const { nome, email, matricula, setor, cargo, data_admissao, status } = dados;
    const [resultado] = await db.query(
      `UPDATE colaboradores
       SET nome = ?, email = ?, matricula = ?, setor = ?, cargo = ?, data_admissao = ?, status = ?
       WHERE id = ?`,
      [nome, email, matricula, setor, cargo, data_admissao, status, id]
    );
    return resultado.affectedRows > 0;
  },

  excluir: async (id) => {
    const [resultado] = await db.query('DELETE FROM colaboradores WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = Colaborador;