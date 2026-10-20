import { Router } from 'express';
import * as loginController from '../apps/login/controller/loginController.js';

const router = Router();

router.post('/login', loginController.login);

export default router;
