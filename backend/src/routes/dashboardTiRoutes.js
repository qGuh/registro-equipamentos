// backend/src/routes/dashboardTiRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const dashboardTiController = require('../controllers/dashboardTiController');

router.use(authMiddleware);

router.get('/summary', dashboardTiController.summary);
router.get('/equipamentos-por-tipo', dashboardTiController.equipamentosPorTipo);

module.exports = router;