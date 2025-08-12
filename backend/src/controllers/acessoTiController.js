const AcessoTi = require('../models/acessoTi');
const LogAuditoria = require('../models/logAuditoria');

exports.listar = async (req, res) => {
  try {
    const resultados = await AcessoTi.listar();
    res.status(200).json(resultados);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar acessos de TI.' });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await AcessoTi.buscarPorId(id);
    if (!resultado) {
      return res.status(404).json({ erro: 'Acesso não encontrado.' });
    }
    res.status(200).json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar acesso por ID.' });
  }
};

exports.criar = async (req, res) => {
  try {
    const dados = req.body;
    const novoId = await AcessoTi.criar(dados);

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'INSERÇÃO',
      tabela_afetada: 'acessos_ti',
      id_registro: novoId,
      detalhes: JSON.stringify(dados)
    });

    res.status(201).json({ id: novoId, mensagem: 'Acesso criado com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar acesso de TI.' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    const sucesso = await AcessoTi.atualizar(id, dados);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Acesso não encontrado para atualização.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'ATUALIZAÇÃO',
      tabela_afetada: 'acessos_ti',
      id_registro: id,
      detalhes: JSON.stringify(dados)
    });

    res.status(200).json({ mensagem: 'Acesso atualizado com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar acesso de TI.' });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await AcessoTi.excluir(id);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Acesso não encontrado para exclusão.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'EXCLUSÃO',
      tabela_afetada: 'acessos_ti',
      id_registro: id
    });

    res.status(200).json({ mensagem: 'Acesso excluído com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir acesso de TI.' });
  }
};