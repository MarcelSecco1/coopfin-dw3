import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as lancamentosController from '../apps/lancamentos/controller/lancamentosController.js';

const router = Router();

router.get('/getAllLancamentos', authenticateToken, lancamentosController.getAllLancamentos);
router.get('/getLancamentoByID/:id', authenticateToken, lancamentosController.getLancamentoByID);
router.post('/insertLancamento', authenticateToken, lancamentosController.insertLancamento);
router.put('/updateLancamento/:id', authenticateToken, lancamentosController.updateLancamento);
router.delete('/deleteLancamento/:id', authenticateToken, lancamentosController.deleteLancamento);

export default router;
