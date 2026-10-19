import { Router } from 'express';
import { pool } from '../database/pool.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const fields = `id, nome, tipo, instituicao, saldo_inicial AS "saldoInicial", removido, criado_em AS "criadoEm"`;
const types = new Set(['corrente', 'poupanca', 'caixa', 'investimento']);
const valid = (body) => body.nome?.trim() && types.has(body.tipo) && Number.isFinite(Number(body.saldoInicial ?? 0));

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${fields} FROM contas WHERE removido = FALSE ORDER BY nome`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${fields} FROM contas WHERE id = $1 AND removido = FALSE`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Conta não encontrada.' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!valid(req.body)) return res.status(400).json({ message: 'Dados da conta inválidos.' });
    const { nome, tipo, instituicao = '', saldoInicial = 0 } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO contas (nome, tipo, instituicao, saldo_inicial) VALUES ($1, $2, $3, $4) RETURNING ${fields}`,
      [nome.trim(), tipo, instituicao.trim(), saldoInicial],
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!valid(req.body)) return res.status(400).json({ message: 'Dados da conta inválidos.' });
    const { nome, tipo, instituicao = '', saldoInicial = 0 } = req.body;
    const { rows } = await pool.query(
      `UPDATE contas SET nome = $1, tipo = $2, instituicao = $3, saldo_inicial = $4 WHERE id = $5 AND removido = FALSE RETURNING ${fields}`,
      [nome.trim(), tipo, instituicao.trim(), saldoInicial, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ message: 'Conta não encontrada.' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE contas SET removido = TRUE WHERE id = $1 AND removido = FALSE RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Conta não encontrada.' });
    res.json({ message: 'Conta removida com sucesso.' });
  } catch (error) {
    if (error.code === '23503') return res.status(409).json({ message: 'Há lançamentos associados. Remova-os antes de excluir esta conta.' });
    next(error);
  }
});

export default router;
