// src/routes/movimentacaoPecasRoutes.js
const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const requireAdmin = require('../middlewares/requireAdmin');
// ATENÇÃO: nome exato do arquivo do controller é "movimentacaoPecaController.js" (singular)
const mov = require('../controllers/movimentacaoPecaController');

// Se quiser conferir, habilite a linha abaixo temporariamente:
// console.log('mov keys =>', Object.keys(mov)); // deve mostrar ["listar","movimentar"]

router.use(auth);

// listar movimentações da peça
router.get('/:id/movimentacoes', mov.listar);

// registrar movimentação (somente admin)
router.post('/:id/movimentar', requireAdmin, mov.movimentar);

module.exports = router;