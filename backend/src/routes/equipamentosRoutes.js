const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');
const ctrl = require('../controllers/equipamentosController');

// Todas as rotas exigem JWT
router.use(auth);

// Leitura
router.get('/', ctrl.listar);
router.get('/export', ctrl.exportarCsv);
router.get('/:id', ctrl.obterPorId);
router.get('/:id/historico', ctrl.historico);

// Escrita (apenas admin)
router.post('/', requireAdmin, ctrl.criar);
router.put('/:id', requireAdmin, ctrl.atualizar);
router.delete('/:id', requireAdmin, ctrl.remover); // baixa lógica (inativar)
router.post('/:id/historico/alocar', requireAdmin, ctrl.alocar);
router.post('/:id/historico/desalocar', requireAdmin, ctrl.desalocar);

// EXCLUSÃO DEFINITIVA (apenas admin)
router.delete('/:id/excluir', requireAdmin, ctrl.excluir);

module.exports = router;