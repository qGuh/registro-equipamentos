const MovimentacaoPeca = require('../models/movimentacaoPeca');
const LogAuditoria = require('../models/logAuditoria');

exports.listar = async (req, res) => {
  try {
    const resultados = await MovimentacaoPeca.listar();
    res.status(200).json(resultados);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar movimentações de peças.' });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await MovimentacaoPeca.buscarPorId(id);
    if (!resultado) {
      return res.status(404).json({ erro: 'Movimentação não encontrada.' });
    }
    res.status(200).json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar movimentação por ID.' });
  }
};

exports.criar = async (req, res) => {
  try {
    const dados = req.body;
    const novoId = await MovimentacaoPeca.criar(dados);

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'INSERÇÃO',
      tabela_afetada: 'movimentacao_pecas',
      id_registro: novoId,
      detalhes: JSON.stringify(dados)
    });

    res.status(201).json({ id: novoId, mensagem: 'Movimentação criada com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar movimentação de peça.' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    const sucesso = await MovimentacaoPeca.atualizar(id, dados);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Movimentação não encontrada para atualização.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'ATUALIZAÇÃO',
      tabela_afetada: 'movimentacao_pecas',
      id_registro: id,
      detalhes: JSON.stringify(dados)
    });

    res.status(200).json({ mensagem: 'Movimentação atualizada com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar movimentação de peça.' });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await MovimentacaoPeca.excluir(id);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Movimentação não encontrada para exclusão.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'EXCLUSÃO',
      tabela_afetada: 'movimentacao_pecas',
      id_registro: id
    });

    res.status(200).json({ mensagem: 'Movimentação excluída com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir movimentação de peça.' });
  }
};