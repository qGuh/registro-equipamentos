const express = require('express');
const router = express.Router();
const qualidadeController = require('../controllers/qualidadeController');

router.get('/setores', qualidadeController.getSetores);
router.get('/indicadores', qualidadeController.getIndicadores);
router.post('/indicadores', qualidadeController.createIndicador);
router.put('/indicadores/:id', qualidadeController.updateIndicador);
router.delete('/indicadores/:id', qualidadeController.deleteIndicador);

router.get('/lancamentos', qualidadeController.getRegistros);
router.post('/lancamentos', qualidadeController.createRegistro);
router.put('/lancamentos/:id', qualidadeController.updateRegistro);
router.delete('/lancamentos/:id', qualidadeController.deleteRegistro);

router.get('/dashboard', qualidadeController.getDashboard);

module.exports = router;