const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');
const ctrl = require('../controllers/pecaReposicaoController');

router.use(auth);

// leitura
router.get('/', ctrl.listar);
router.get('/export', ctrl.exportarCsv);
router.get('/:id', ctrl.obterPorId);

// escrita (admin)
router.post('/', requireAdmin, ctrl.criar);
router.put('/:id', requireAdmin, ctrl.atualizar);
router.delete('/:id', requireAdmin, ctrl.remover);

module.exports = router;