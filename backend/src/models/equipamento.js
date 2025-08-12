const db = require('../config/database');

const Equipamento = {
  listar: async () => {
    const [rows] = await db.query('SELECT * FROM equipamentos WHERE status != "inativo"');
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query('SELECT * FROM equipamentos WHERE id = ?', [id]);
    return rows[0];
  },

  criar: async (dados) => {
    const {
      tipo, marca, modelo, numero_serie, data_aquisicao, localizacao, status
    } = dados;

    const [resultado] = await db.query(
      `INSERT INTO equipamentos (tipo, marca, modelo, numero_serie, data_aquisicao, localizacao, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tipo, marca, modelo, numero_serie, data_aquisicao, localizacao, status || 'ativo']
    );
    return resultado.insertId;
  },

  atualizar: async (id, dados) => {
    const {
      tipo, marca, modelo, numero_serie, data_aquisicao, localizacao, status
    } = dados;

    const [resultado] = await db.query(
      `UPDATE equipamentos
       SET tipo = ?, marca = ?, modelo = ?, numero_serie = ?, data_aquisicao = ?, localizacao = ?, status = ?
       WHERE id = ?`,
      [tipo, marca, modelo, numero_serie, data_aquisicao, localizacao, status, id]
    );
    return resultado.affectedRows > 0;
  },

  excluir: async (id) => {
    const [resultado] = await db.query('DELETE FROM equipamentos WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  }
};

module.exports = Equipamento;