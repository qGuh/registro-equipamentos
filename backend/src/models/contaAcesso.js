const db = require('../config/database');

const ContaAcesso = {
  listar: async () => {
    const [rows] = await db.query('SELECT * FROM contas_acesso WHERE status != "inativo"');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM contas_acesso WHERE id = ?', [id]);
    return rows[0];
  },

  criar: async (dados) => {
    const {
      plataforma, login, senha, categoria, id_colaborador, ultima_atualizacao
    } = dados;

    const [resultado] = await db.query(
      `INSERT INTO contas_acesso (plataforma, login, senha, categoria, id_colaborador, ultima_atualizacao, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [plataforma, login, senha, categoria, id_colaborador, ultima_atualizacao, 'ativo']
    );
    return resultado.insertId;
  },

  atualizar: async (id, dados) => {
    const {
      plataforma, login, senha, categoria, id_colaborador, ultima_atualizacao, status
    } = dados;

    const [resultado] = await db.query(
      `UPDATE contas_acesso
       SET plataforma = ?, login = ?, senha = ?, categoria = ?, id_colaborador = ?, ultima_atualizacao = ?, status = ?
       WHERE id = ?`,
      [plataforma, login, senha, categoria, id_colaborador, ultima_atualizacao, status, id]
    );
    return resultado.affectedRows > 0;
  },

  excluir: async (id) => {
    const [resultado] = await db.query('DELETE FROM contas_acesso WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = ContaAcesso;