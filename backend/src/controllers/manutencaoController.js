const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// -------------------------------------------------------------
// Helpers de Banco de Dados e Auditoria
// -------------------------------------------------------------
async function q(sql, params = []) { 
  const [rows] = await db.execute(sql, params); 
  return rows; 
}

function usuarioReq(req) {
  return req.user?.login || req.user?.nome || (req.user?.id ? `user#${req.user.id}` : 'Sistema');
}

const toNull = (v) =>
  (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) ? null : v;

function toYMD(v) {
  if (v === undefined || v === null || v === '') return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  if (!s) return null;
  if (s.includes('T')) return s.split('T')[0]; 
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {        
    const [d, m, y] = s.split('/');
    return `${y}-${m}-${d}`;
  }
  return s.slice(0, 10);
}

// Grava também no Log Global do Sistema para manter o padrão
async function registarAuditoriaGlobal(usuario, acao, id_registro, detalhes) {
  try {
    await db.execute(
      `INSERT INTO log_auditoria (usuario, acao, tabela_afetada, id_registro, data_hora, detalhes) 
       VALUES (?, ?, 'manutencoes', ?, NOW(), ?)`,
      [usuario || 'Sistema', acao, id_registro, JSON.stringify(detalhes)]
    );
  } catch (err) {
    console.error('Erro ao gravar log de auditoria global:', err);
  }
}

async function existeOutraOSAberta(conn, idEquip, ignorarId = null) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS tot
       FROM manutencoes
      WHERE id_equipamento = ?
        AND data_fim IS NULL
        ${ignorarId ? 'AND id <> ?' : ''}`,
    ignorarId ? [idEquip, ignorarId] : [idEquip]
  );
  return (rows[0]?.tot || 0) > 0;
}

function parseAnexos(val) {
  if (!val) return [];
  try { const a = JSON.parse(val); return Array.isArray(a) ? a : []; }
  catch { return []; }
}

// -------------------------------------------------------------
// Controladores Principais
// -------------------------------------------------------------

exports.listar = async (req, res) => {
  try {
    const {
      q: termo = '', status, equipamento_id,
      page = 1, pageSize = 10, sortBy = 'data_inicio', sortDir = 'desc',
    } = req.query;

    const PAGE = Math.max(parseInt(page) || 1, 1);
    const SIZE = Math.min(Math.max(parseInt(pageSize) || 10, 1), 100);
    const allowedSort = new Set(['id','data_inicio','data_fim','tecnico_responsavel']);
    const by  = allowedSort.has(String(sortBy)) ? String(sortBy) : 'data_inicio';
    const dir = String(sortDir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const offset = (PAGE - 1) * SIZE;

    const filtros = []; const params = [];
    if (termo) {
      filtros.push(`(m.descricao_problema LIKE ? OR m.solucao LIKE ? OR m.tecnico_responsavel LIKE ? 
                 OR e.tipo LIKE ? OR e.marca LIKE ? OR e.modelo LIKE ? OR e.numero_serie LIKE ? OR e.patrimonio LIKE ?)`);
      for (let i = 0; i < 8; i++) params.push(`%${termo}%`);
    }
    if (status === 'aberta')    filtros.push(`m.data_fim IS NULL`);
    if (status === 'concluida') filtros.push(`m.data_fim IS NOT NULL`);
    if (equipamento_id) { filtros.push(`m.id_equipamento = ?`); params.push(equipamento_id); }

    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

    const [count] = await db.execute(`SELECT COUNT(*) AS total FROM manutencoes m JOIN equipamentos e ON e.id = m.id_equipamento ${where}`, params);
    const total = count[0]?.total || 0;

    const sql = `
      SELECT m.*, CASE WHEN m.data_fim IS NULL THEN 'aberta' ELSE 'concluida' END AS status,
             e.tipo, e.marca, e.modelo, e.numero_serie, e.patrimonio
        FROM manutencoes m
        JOIN equipamentos e ON e.id = m.id_equipamento
        ${where}
       ORDER BY m.${by} ${dir} LIMIT ${SIZE} OFFSET ${offset}`;
    const [rows] = await db.execute(sql, params);

    res.json({ items: rows, page: PAGE, pageSize: SIZE, total, totalPages: Math.ceil(total / SIZE) || 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao listar manutenções.' });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const os = await q(
      `SELECT m.*, CASE WHEN m.data_fim IS NULL THEN 'aberta' ELSE 'concluida' END AS status,
              e.tipo, e.marca, e.modelo, e.numero_serie, e.patrimonio
         FROM manutencoes m
         JOIN equipamentos e ON e.id = m.id_equipamento
        WHERE m.id = ?`, [id]);
    if (!os.length) return res.status(404).json({ message: 'Manutenção não encontrada' });
    res.json(os[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar manutenção.' });
  }
};

exports.criar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const b = req.body ?? {};
    const id_equipamento = b.id_equipamento;
    if (!id_equipamento) return res.status(400).json({ message: 'Equipamento é obrigatório.' });

    const eq = await q(`SELECT id, status, colaborador_atual_id FROM equipamentos WHERE id = ?`, [id_equipamento]);
    if (!eq.length) return res.status(404).json({ message: 'Equipamento não encontrado.' });
    if (eq[0].status === 'inativo') return res.status(400).json({ message: 'Equipamento inativo.' });

    const data_inicio = toYMD(b.data_inicio) || new Date().toISOString().slice(0,10);
    const data_fim    = toYMD(b.data_fim); 
    const descricao_problema   = toNull(b.descricao_problema);
    const solucao             = toNull(b.solucao);
    const tecnico_responsavel = toNull(b.tecnico_responsavel);
    const anexos              = toNull(b.anexos);

    await conn.beginTransaction();

    const [r] = await conn.execute(
      `INSERT INTO manutencoes (id_equipamento, data_inicio, data_fim, descricao_problema, solucao, tecnico_responsavel, anexos)
       VALUES (?,?,?,?,?,?,?)`,
      [id_equipamento, data_inicio, data_fim, descricao_problema, solucao, tecnico_responsavel, anexos]
    );
    const novoId = r.insertId;
    const usuario = usuarioReq(req);

    const antes = eq[0].status;
    await conn.execute(`UPDATE equipamentos SET status='manutencao' WHERE id=?`, [id_equipamento]);
    await conn.execute(
      `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, usuario)
       VALUES (?,'MANUTENCAO', ?, ?, 'manutencao', ?)` ,
      [id_equipamento, `Abertura OS #${novoId}`, antes, usuario]
    );

    await conn.commit();
    await registarAuditoriaGlobal(usuario, 'INSERÇÃO', novoId, b);

    const [created] = await db.execute(`SELECT * FROM manutencoes WHERE id = ?`, [novoId]);
    res.status(201).json(created[0]);
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao criar OS.' });
  } finally {
    conn.release();
  }
};

exports.atualizar = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const os = await q(`SELECT * FROM manutencoes WHERE id = ?`, [id]);
    if (!os.length) return res.status(404).json({ message: 'Manutenção não encontrada' });
    const atual = os[0];

    const data_inicio = toYMD(req.body.data_inicio ?? atual.data_inicio);
    const data_fim    = toYMD(req.body.data_fim ?? atual.data_fim);
    const descricao_problema   = toNull(req.body.descricao_problema ?? atual.descricao_problema);
    const solucao             = toNull(req.body.solucao ?? atual.solucao);
    const tecnico_responsavel = toNull(req.body.tecnico_responsavel ?? atual.tecnico_responsavel);
    const anexos              = toNull(req.body.anexos ?? atual.anexos);

    const finalizandoAgora = (atual.data_fim == null && data_fim != null);
    const usuario = usuarioReq(req);

    await conn.beginTransaction();

    await conn.execute(
      `UPDATE manutencoes SET data_inicio=?, data_fim=?, descricao_problema=?, solucao=?, tecnico_responsavel=?, anexos=? WHERE id=?`,
      [data_inicio, data_fim, descricao_problema, solucao, tecnico_responsavel, anexos, id]
    );

    if (finalizandoAgora) {
      const outraAberta = await existeOutraOSAberta(conn, atual.id_equipamento, id);
      if (!outraAberta) {
        const [eqRows] = await conn.execute(`SELECT id, status, colaborador_atual_id FROM equipamentos WHERE id=?`, [atual.id_equipamento]);
        if (eqRows.length) {
          const novoStatus = eqRows[0].colaborador_atual_id ? 'alocado' : 'disponivel';
          await conn.execute(`UPDATE equipamentos SET status=? WHERE id=?`, [novoStatus, eqRows[0].id]);
          await conn.execute(
            `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, usuario)
             VALUES (?,'MANUTENCAO', ?, 'manutencao', ?, ?)` ,
            [eqRows[0].id, `Encerramento OS #${id}`, novoStatus, usuario]
          );
        }
      }
    }

    await conn.commit();
    await registarAuditoriaGlobal(usuario, 'ATUALIZAÇÃO', id, req.body || {});

    res.json({ message: 'Manutenção atualizada com sucesso' });
  } catch (err) {
    await (conn?.rollback?.());
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar manutenção.' });
  } finally {
    conn.release();
  }
};

exports.excluir = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const os = await q(`SELECT * FROM manutencoes WHERE id = ?`, [id]);
    if (!os.length) return res.status(404).json({ message: 'Manutenção não encontrada' });
    const atual = os[0];
    const usuario = usuarioReq(req);

    await conn.beginTransaction();

    // ✅ CORRIGIDO: Mudamos para id_manutencao e blindamos contra erros de coluna inexistente
    try { 
      await conn.execute(`DELETE FROM movimentacao_pecas WHERE id_manutencao = ?`, [id]); 
    } catch (e) { 
      if (e.code !== 'ER_NO_SUCH_TABLE' && e.code !== 'ER_BAD_FIELD_ERROR') throw e; 
    }

    await conn.execute(`DELETE FROM manutencoes WHERE id = ?`, [id]);

    const outraAberta = await existeOutraOSAberta(conn, atual.id_equipamento);
    if (!outraAberta) {
      const [eqRows] = await conn.execute(`SELECT id, status, colaborador_atual_id FROM equipamentos WHERE id=?`, [atual.id_equipamento]);
      if (eqRows.length && eqRows[0].status === 'manutencao') {
        const novoStatus = eqRows[0].colaborador_atual_id ? 'alocado' : 'disponivel';
        await conn.execute(`UPDATE equipamentos SET status=? WHERE id=?`, [novoStatus, eqRows[0].id]);
        await conn.execute(
          `INSERT INTO historico_equipamentos (equipamento_id, acao, detalhes, de_status, para_status, usuario)
           VALUES (?,'MANUTENCAO', ?, 'manutencao', ?, ?)` ,
          [eqRows[0].id, `Exclusão da OS #${id}`, novoStatus, usuario]
        );
      }
    }

    await conn.commit();
    await registarAuditoriaGlobal(usuario, 'EXCLUSÃO', id, { excluido: true });

    res.json({ message: 'Manutenção excluída.' });
  } catch (err) {
    await (conn?.rollback?.());
    console.error('Erro na exclusao da OS:', err);
    res.status(500).json({ message: 'Erro ao excluir manutenção.' });
  } finally {
    conn.release();
  }
};

// ---------- ANEXOS ----------
exports.anexarArquivos = async (req, res) => {
  try {
    const { id } = req.params;
    const osRows = await q(`SELECT id, anexos FROM manutencoes WHERE id = ?`, [id]);
    if (!osRows.length) return res.status(404).json({ message: 'Manutenção não encontrada' });

    const baseUrl = '/uploads';
    const atuais = parseAnexos(osRows[0].anexos);

    const novos = (req.files || []).map(f => ({
      filename: f.filename, originalname: f.originalname, mimetype: f.mimetype,
      size: f.size, url: `${baseUrl}/${f.filename}`, uploaded_at: new Date().toISOString()
    }));

    const merged = [...atuais, ...novos];
    await q(`UPDATE manutencoes SET anexos = ? WHERE id = ?`, [JSON.stringify(merged), id]);
    
    await registarAuditoriaGlobal(usuarioReq(req), 'UPLOAD_ANEXOS', id, novos);
    res.json({ anexos: merged });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Falha ao anexar arquivos.' });
  }
};

exports.removerAnexo = async (req, res) => {
  try {
    const { id, filename } = req.params;
    const osRows = await q(`SELECT id, anexos FROM manutencoes WHERE id = ?`, [id]);
    if (!osRows.length) return res.status(404).json({ message: 'Manutenção não encontrada' });

    const atuais = parseAnexos(osRows[0].anexos);
    const restante = atuais.filter(a => a.filename !== filename);
    if (atuais.length === restante.length) return res.status(404).json({ message: 'Anexo não encontrado.' });

    await q(`UPDATE manutencoes SET anexos = ? WHERE id = ?`, [restante.length ? JSON.stringify(restante) : null, id]);

    try {
      const { UP_DIR } = require('../middlewares/uploadMiddleware');
      fs.unlink(path.join(UP_DIR, filename), () => {});
    } catch {}

    await registarAuditoriaGlobal(usuarioReq(req), 'REMOCAO_ANEXO', id, { filename });
    res.json({ anexos: restante });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Falha ao remover anexo.' });
  }
};