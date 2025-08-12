const PecaReposicao = require('../models/pecaReposicao');
const LogAuditoria = require('../models/logAuditoria');

exports.listar = async (req, res) => {
  try {
    const resultados = await PecaReposicao.listar();
    res.status(200).json(resultados);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar peças de reposição.' });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await PecaReposicao.buscarPorId(id);
    if (!resultado) {
      return res.status(404).json({ erro: 'Peça não encontrada.' });
    }
    res.status(200).json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar peça por ID.' });
  }
};

exports.criar = async (req, res) => {
  try {
    const dados = req.body;
    const novoId = await PecaReposicao.criar(dados);

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'INSERÇÃO',
      tabela_afetada: 'pecas_reposicao',
      id_registro: novoId,
      detalhes: JSON.stringify(dados)
    });

    res.status(201).json({ id: novoId, mensagem: 'Peça criada com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar peça de reposição.' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    const sucesso = await PecaReposicao.atualizar(id, dados);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Peça não encontrada para atualização.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'ATUALIZAÇÃO',
      tabela_afetada: 'pecas_reposicao',
      id_registro: id,
      detalhes: JSON.stringify(dados)
    });

    res.status(200).json({ mensagem: 'Peça atualizada com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar peça de reposição.' });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await PecaReposicao.excluir(id);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Peça não encontrada para exclusão.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'EXCLUSÃO',
      tabela_afetada: 'pecas_reposicao',
      id_registro: id
    });

    res.status(200).json({ mensagem: 'Peça excluída com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir peça de reposição.' });
  }
};