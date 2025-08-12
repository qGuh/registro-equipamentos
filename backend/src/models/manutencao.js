const db = require('../config/database');

const Manutencao = {
  listar: async () => {
    const [rows] = await db.query('SELECT * FROM manutencoes WHERE status != "inativo"');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM manutencoes WHERE id = ?', [id]);
    return rows[0];
  },

  criar: async (dados) => {
    const {
      id_equipamento, data_inicio, data_fim, descricao_problema,
      solucao, tecnico_responsavel, anexos
    } = dados;

    const [resultado] = await db.query(
      `INSERT INTO manutencoes
       (id_equipamento, data_inicio, data_fim, descricao_problema, solucao, tecnico_responsavel, anexos, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_equipamento, data_inicio, data_fim, descricao_problema, solucao, tecnico_responsavel, anexos, 'ativo']
    );
    return resultado.insertId;
  },

  atualizar: async (id, dados) => {
    const {
      id_equipamento, data_inicio, data_fim, descricao_problema,
      solucao, tecnico_responsavel, anexos, status
    } = dados;

    const [resultado] = await db.query(
      `UPDATE manutencoes
       SET id_equipamento = ?, data_inicio = ?, data_fim = ?, descricao_problema = ?, solucao = ?,
           tecnico_responsavel = ?, anexos = ?, status = ?
       WHERE id = ?`,
      [id_equipamento, data_inicio, data_fim, descricao_problema, solucao, tecnico_responsavel, anexos, status, id]
    );
    return resultado.affectedRows > 0;
  },

  excluir: async (id) => {
    const [resultado] = await db.query('DELETE FROM manutencoes WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = Manutencao;