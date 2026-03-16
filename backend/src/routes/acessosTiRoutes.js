const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware'); // ou o nome que utiliza
// Como não sei se tem o ficheiro requireAdmin, criei um middleware simples aqui caso não tenha
const requireAdmin = require('../middlewares/requireAdmin') || ((req, res, next) => {
    const p = String(req.user?.perfil || req.usuario?.tipo_perfil || '').toLowerCase();
    if (p === 'admin' || p === 'administrador') return next();
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
});

const acessosTiController = require('../controllers/acessoTiController');

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// Qualquer utilizador autenticado pode listar e ver os detalhes
router.get('/', acessosTiController.listar);
router.get('/:id', acessosTiController.buscarPorId);

// Apenas administradores podem modificar
router.post('/', requireAdmin, acessosTiController.criar);
router.put('/:id', requireAdmin, acessosTiController.atualizar);
router.delete('/:id', requireAdmin, acessosTiController.excluir);

module.exports = router;