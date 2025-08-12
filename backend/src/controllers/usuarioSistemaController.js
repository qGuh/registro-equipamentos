const UsuarioSistema = require('../models/usuarioSistema');
const LogAuditoria = require('../models/logAuditoria');

exports.listar = async (req, res) => {
  try {
    const usuarios = await UsuarioSistema.listar();
    res.status(200).json(usuarios);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao listar usuários do sistema.' });
  }
};

exports.buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await UsuarioSistema.buscarPorId(id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    res.status(200).json(usuario);
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao buscar usuário por ID.' });
  }
};

exports.criar = async (req, res) => {
  try {
    const dados = req.body;
    const novoId = await UsuarioSistema.criar(dados);

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'INSERÇÃO',
      tabela_afetada: 'usuarios_sistema',
      id_registro: novoId,
      detalhes: JSON.stringify({ ...dados, senha: '***' }) // oculta senha no log
    });

    res.status(201).json({ id: novoId, mensagem: 'Usuário criado com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao criar usuário.' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;
    const sucesso = await UsuarioSistema.atualizar(id, dados);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Usuário não encontrado para atualização.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'ATUALIZAÇÃO',
      tabela_afetada: 'usuarios_sistema',
      id_registro: id,
      detalhes: JSON.stringify({ ...dados, senha: '***' })
    });

    res.status(200).json({ mensagem: 'Usuário atualizado com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao atualizar usuário.' });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await UsuarioSistema.excluir(id);

    if (!sucesso) {
      return res.status(404).json({ erro: 'Usuário não encontrado para exclusão.' });
    }

    await LogAuditoria.registrar({
      usuario: req.usuario.nome,
      acao: 'EXCLUSÃO',
      tabela_afetada: 'usuarios_sistema',
      id_registro: id
    });

    res.status(200).json({ mensagem: 'Usuário excluído com sucesso.' });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro ao excluir usuário.' });
  }
};