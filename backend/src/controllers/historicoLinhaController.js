const HistoricoLinha = require('../models/historicoLinha');
const LogAuditoria = require('../models/logAuditoria');

exports.listar = async (req, res) => {
  try {
    const resultados = await HistoricoLinha.listar();
    res.status(200).json(resultados);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar histórico de linhas.' });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await HistoricoLinha.buscarPorId(id);
    if (!resultado) {
      return res.status(404).json({ erro: 'Registro não encontrado.' });
    }
    res.status(200).json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar registro por ID.' });
  }
};

exports.criar = async (req, res) => {
  try {
    const dados = req.body;
    const novoId = await HistoricoLinha.criar(dados);

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'INSERÇÃO',
      tabela_afetada: 'historico_linhas',
      id_registro: novoId,
      detalhes: JSON.stringify(dados)
    });

    res.status(201).json({ id: novoId, mensagem: 'Registro criado com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar histórico da linha.' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    const sucesso = await HistoricoLinha.atualizar(id, dados);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Registro não encontrado para atualização.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'ATUALIZAÇÃO',
      tabela_afetada: 'historico_linhas',
      id_registro: id,
      detalhes: JSON.stringify(dados)
    });

    res.status(200).json({ mensagem: 'Registro atualizado com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar histórico da linha.' });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await HistoricoLinha.excluir(id);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Registro não encontrado para exclusão.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'EXCLUSÃO',
      tabela_afetada: 'historico_linhas',
      id_registro: id
    });

    res.status(200).json({ mensagem: 'Registro excluído com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir histórico da linha.' });
  }
};