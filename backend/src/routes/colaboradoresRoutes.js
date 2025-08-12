const express = require('express');
const router = express.Router();
const colaboradorController = require('../controllers/colaboradorController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', colaboradorController.listar);
router.get('/:id', colaboradorController.buscarPorId);
router.post('/', colaboradorController.criar);
router.put('/:id', colaboradorController.atualizar);
router.delete('/:id', colaboradorController.excluir);

module.exports = router;