const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');
const upload = require('../middlewares/uploadMiddleware');
const ctrl = require('../controllers/manutencaoController');

// Todas as rotas abaixo exigem usuário autenticado
router.use(auth);

// CRUD
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscarPorId);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', requireAdmin, ctrl.excluir);


router.post('/:id/anexos', upload.array('files', 10), ctrl.anexarArquivos);
router.delete('/:id/anexos/:filename', ctrl.removerAnexo);

module.exports = router;