const express = require('express');
const router = express.Router();
const contaAcessoController = require('../controllers/contaAcessoController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware); // protege todas as rotas abaixo

router.get('/', contaAcessoController.listar);
router.get('/:id', contaAcessoController.buscarPorId);
router.post('/', contaAcessoController.criar);
router.put('/:id', contaAcessoController.atualizar);
router.delete('/:id', contaAcessoController.excluir);

module.exports = router;