// backend/src/controllers/dashboardTiController.js
const db = require('../config/database');

async function run(sql, params = []) {
  if (db && typeof db.query === 'function') return db.query(sql, params);
  if (db?.pool && typeof db.pool.query === 'function') return db.pool.query(sql, params);
  throw new Error('DB connector não expõe query(). Verifique backend/src/config/database.js');
}

// Normaliza "tipo" para: Celular | Notebook | PC | Outros
function tipoNormSQL() {
  return `
    CASE
      WHEN LOWER(e.tipo) LIKE '%cel%' THEN 'Celular'
      WHEN LOWER(e.tipo) LIKE '%note%' THEN 'Notebook'
      WHEN LOWER(e.tipo) LIKE '%desktop%' OR LOWER(e.tipo) LIKE '%pc%' THEN 'PC'
      ELSE 'Outros'
    END
  `;
}

exports.summary = async (req, res) => {
  try {
    // colaboradores ativos (ajuste se seu status tiver outro texto)
    const [colabRows] = await run(
      `SELECT COUNT(*) AS total FROM colaboradores WHERE status = 'ativo'`
    );

    // equipamentos por status
    const [equipRows] = await run(`
      SELECT
        SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) AS disponiveis,
        SUM(CASE WHEN status = 'alocado' THEN 1 ELSE 0 END) AS alocados,
        SUM(CASE WHEN status = 'manutencao' THEN 1 ELSE 0 END) AS manutencao,
        SUM(CASE WHEN status = 'inativo' THEN 1 ELSE 0 END) AS inativos,
        COUNT(*) AS total
      FROM equipamentos
    `);

    return res.json({
      colaboradoresAtivos: Number(colabRows?.[0]?.total || 0),
      equipamentos: {
        disponiveis: Number(equipRows?.[0]?.disponiveis || 0),
        alocados: Number(equipRows?.[0]?.alocados || 0),
        manutencao: Number(equipRows?.[0]?.manutencao || 0),
        inativos: Number(equipRows?.[0]?.inativos || 0),
        total: Number(equipRows?.[0]?.total || 0),
      },
    });
  } catch (err) {
    console.error('dashboardTi.summary erro:', err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.equipamentosPorTipo = async (req, res) => {
  try {
    const tipoExpr = tipoNormSQL();

    // só disponivel/alocado (como você pediu)
    const [rows] = await run(
      `
      SELECT
        ${tipoExpr} AS tipo,
        SUM(CASE WHEN e.status = 'disponivel' THEN 1 ELSE 0 END) AS disponivel,
        SUM(CASE WHEN e.status = 'alocado' THEN 1 ELSE 0 END) AS alocado
      FROM equipamentos e
      WHERE e.status IN ('disponivel','alocado')
      GROUP BY ${tipoExpr}
      ORDER BY FIELD(tipo, 'Celular', 'Notebook', 'PC', 'Outros')
      `
    );

    return res.json({ items: rows });
  } catch (err) {
    console.error('dashboardTi.equipamentosPorTipo erro:', err);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};