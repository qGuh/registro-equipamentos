const ContaAcesso = require('../models/contaAcesso');
const LogAuditoria = require('../models/logAuditoria');

exports.listar = (req, res) => {
  ContaAcesso.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  const { id } = req.params;
  ContaAcesso.getById(id, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0)
      return res.status(404).json({ message: 'Conta não encontrada' });
    res.json(results[0]);
  });
};

exports.criar = (req, res) => {
  ContaAcesso.create(req.body, async (err, result) => {
    if (err) return res.status(500).json({ error: err });

    await LogAuditoria.registrar({
      usuario: req.body.usuario || 'sistema',
      acao: 'inserção',
      tabela_afetada: 'contas_acesso',
      id_registro: result.insertId,
      detalhes: JSON.stringify(req.body)
    });

    res.status(201).json({ id: result.insertId, ...req.body });
  });
};

exports.atualizar = (req, res) => {
  const { id } = req.params;
  ContaAcesso.update(id, req.body, async (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Conta não encontrada' });

    await LogAuditoria.registrar({
      usuario: req.body.usuario || 'sistema',
      acao: 'atualização',
      tabela_afetada: 'contas_acesso',
      id_registro: id,
      detalhes: JSON.stringify(req.body)
    });

    res.json({ message: 'Conta atualizada com sucesso' });
  });
};

exports.excluir = (req, res) => {
  const { id } = req.params;
  ContaAcesso.delete(id, async (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Conta não encontrada' });

    await LogAuditoria.registrar({
      usuario: req.body.usuario || 'sistema',
      acao: 'remoção',
      tabela_afetada: 'contas_acesso',
      id_registro: id,
      detalhes: null
    });

    res.json({ message: 'Conta marcada como inativa' });
  });
};