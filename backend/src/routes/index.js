const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API do Sistema de TI funcionando.' });
});

// Rotas principais
router.use('/acessos-ti', require('./acessosTiRoutes'));
router.use('/colaboradores', require('./colaboradoresRoutes'));
router.use('/contas-acesso', require('./contasAcessoRoutes'));
router.use('/equipamentos', require('./equipamentoRoutes'));
router.use('/manutencoes', require('./manutencoesRoutes'));
router.use('/pecas-reposicao', require('./pecasReposicaoRoutes'));
router.use('/movimentacao-pecas', require('./movimentacaoPecasRoutes'));
router.use('/linhas-telefonicas', require('./linhasTelefonicasRoutes'));
router.use('/historico-linhas', require('./historicoLinhasRoutes'));
router.use('/auth', require('./authRoutes'));
router.use('/usuarios-sistema', require('./usuariosSistemaRoutes'));

module.exports = router;