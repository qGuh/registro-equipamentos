const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/equipamentosController'); // PLURAL

router.use(auth);

router.get('/', ctrl.listar);
router.get('/:id', ctrl.obterPorId);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.remover);

router.get('/:id/historico', ctrl.historico);
router.post('/:id/historico/alocar', ctrl.alocar);
router.post('/:id/historico/desalocar', ctrl.desalocar);

module.exports = router;