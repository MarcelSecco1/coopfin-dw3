import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import * as contasController from '../apps/contas/controller/contasController.js';

const router = Router();

router.get('/getAllContas', authenticateToken, contasController.getAllContas);
router.get('/getContaByID/:id', authenticateToken, contasController.getContaByID);
router.post('/insertConta', authenticateToken, contasController.insertConta);
router.put('/updateConta/:id', authenticateToken, contasController.updateConta);
router.delete('/deleteConta/:id', authenticateToken, contasController.deleteConta);

export default router;
