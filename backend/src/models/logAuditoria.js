const db = require('../config/database');

const LogAuditoria = {
  registrar: (usuario, acao, tabela_afetada, id_registro, detalhes = null, callback = () => {}) => {
    const query = `
      INSERT INTO log_auditoria (usuario, acao, tabela_afetada, id_registro, data_hora, detalhes)
      VALUES (?, ?, ?, ?, NOW(), ?)
    `;
    db.query(query, [usuario, acao, tabela_afetada, id_registro, detalhes], callback);
  }
};

module.exports = LogAuditoria;