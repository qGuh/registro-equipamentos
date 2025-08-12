const db = require('../config/database');

const UsuarioSistema = {
  listar: async () => {
    const [rows] = await db.query('SELECT id, nome, email, perfil FROM usuarios_sistema');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT id, nome, email, perfil FROM usuarios_sistema WHERE id = ?', [id]);
    return rows[0];
  },

  criar: async (dados) => {
    const { nome, email, senha, perfil } = dados;
    const [resultado] = await db.query(
      `INSERT INTO usuarios_sistema (nome, email, senha, perfil)
       VALUES (?, ?, ?, ?)`,
      [nome, email, senha, perfil]
    );
    return resultado.insertId;
  },

  atualizar: async (id, dados) => {
    const { nome, email, senha, perfil } = dados;
    const [resultado] = await db.query(
      `UPDATE usuarios_sistema
       SET nome = ?, email = ?, senha = ?, perfil = ?
       WHERE id = ?`,
      [nome, email, senha, perfil, id]
    );
    return resultado.affectedRows > 0;
  },

  excluir: async (id) => {
    const [resultado] = await db.query('DELETE FROM usuarios_sistema WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = UsuarioSistema;