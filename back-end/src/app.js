import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import contasRouter from './routes/contas.js';
import lancamentosRouter from './routes/lancamentos.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',') ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'coopfin-api' }));
app.use('/api/auth', authRouter);
app.use('/api/contas', contasRouter);
app.use('/api/lancamentos', lancamentosRouter);
app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

export default app;
