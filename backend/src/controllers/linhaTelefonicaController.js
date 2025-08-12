const LinhaTelefonica = require('../models/linhaTelefonica');
const LogAuditoria = require('../models/logAuditoria');

exports.listar = async (req, res) => {
  try {
    const resultados = await LinhaTelefonica.listar();
    res.status(200).json(resultados);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar linhas telefônicas.' });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await LinhaTelefonica.buscarPorId(id);
    if (!resultado) {
      return res.status(404).json({ erro: 'Linha não encontrada.' });
    }
    res.status(200).json(resultado);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar linha por ID.' });
  }
};

exports.criar = async (req, res) => {
  try {
    const dados = req.body;
    const novoId = await LinhaTelefonica.criar(dados);

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'INSERÇÃO',
      tabela_afetada: 'linhas_telefonicas',
      id_registro: novoId,
      detalhes: JSON.stringify(dados)
    });

    res.status(201).json({ id: novoId, mensagem: 'Linha criada com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar linha telefônica.' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    const sucesso = await LinhaTelefonica.atualizar(id, dados);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Linha não encontrada para atualização.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'ATUALIZAÇÃO',
      tabela_afetada: 'linhas_telefonicas',
      id_registro: id,
      detalhes: JSON.stringify(dados)
    });

    res.status(200).json({ mensagem: 'Linha atualizada com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar linha telefônica.' });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await LinhaTelefonica.excluir(id);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Linha não encontrada para exclusão.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'EXCLUSÃO',
      tabela_afetada: 'linhas_telefonicas',
      id_registro: id
    });

    res.status(200).json({ mensagem: 'Linha excluída com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir linha telefônica.' });
  }
};