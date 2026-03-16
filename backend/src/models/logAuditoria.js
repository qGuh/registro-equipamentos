// src/models/logAuditoria.js
const db = require('../config/database'); // mysql2/promise

/**
 * Registrar auditoria.
 * A tabela deve ter (id, usuario, acao, tabela_afetada, id_registro, data_hora DEFAULT CURRENT_TIMESTAMP, detalhes)
 */
exports.registrar = async ({ usuario, acao, tabela_afetada, id_registro, detalhes }) => {
  try {
    const det = detalhes == null ? null : String(detalhes);
    await db.execute(
      `INSERT INTO log_auditoria (usuario, acao, tabela_afetada, id_registro, detalhes)
       VALUES (?,?,?,?,?)`,
      [usuario || 'sistema', acao, tabela_afetada || null, id_registro ?? null, det]
    );
  } catch (err) {
    // Não derruba a requisição por erro de auditoria
    console.error('LogAuditoria.registrar:', err.message);
  }
};