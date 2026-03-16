// backend/src/routes/contasAcessoRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');
const contaAcessoController = require('../controllers/contaAcessoController');

// 🔒 todas precisam de login
router.use(authMiddleware);

// ✅ listar + ver detalhes: qualquer usuário logado
router.get('/', contaAcessoController.listar);
router.get('/:id', contaAcessoController.buscarPorId);

// ✅ criar/editar/excluir: somente admin
router.post('/', requireAdmin, contaAcessoController.criar);
router.put('/:id', requireAdmin, contaAcessoController.atualizar);
router.delete('/:id', requireAdmin, contaAcessoController.excluir);

module.exports = router;