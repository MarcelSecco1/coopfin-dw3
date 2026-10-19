import { Router } from 'express';
import { pool } from '../database/pool.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const fields = `l.id, l.descricao, l.valor, l.natureza, TO_CHAR(l.data, 'YYYY-MM-DD') AS data, l.conta_id AS "contaId", c.nome AS "contaNome", l.status, l.removido, l.criado_em AS "criadoEm"`;
const source = 'FROM lancamentos l JOIN contas c ON c.id = l.conta_id';
const validDate = (date) => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
const valid = (body) => body.descricao?.trim() && Number.isFinite(Number(body.valor)) && Number(body.valor) > 0 && ['entrada', 'saida'].includes(body.natureza) && validDate(body.data) && Number.isInteger(Number(body.contaId)) && ['pago', 'pendente'].includes(body.status);

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${fields} ${source} WHERE l.removido = FALSE ORDER BY l.data DESC, l.id DESC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${fields} ${source} WHERE l.id = $1 AND l.removido = FALSE`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Lançamento não encontrado.' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    if (!valid(req.body)) return res.status(400).json({ message: 'Dados do lançamento inválidos.' });
    const { descricao, valor, natureza, data, contaId, status } = req.body;
    const conta = await pool.query('SELECT id FROM contas WHERE id = $1 AND removido = FALSE', [contaId]);
    if (!conta.rowCount) return res.status(400).json({ message: 'Selecione uma conta ativa.' });
    const { rows } = await pool.query(
      `INSERT INTO lancamentos (descricao, valor, natureza, data, conta_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [descricao.trim(), valor, natureza, data, contaId, status],
    );
    const created = await pool.query(`SELECT ${fields} ${source} WHERE l.id = $1`, [rows[0].id]);
    res.status(201).json(created.rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!valid(req.body)) return res.status(400).json({ message: 'Dados do lançamento inválidos.' });
    const { descricao, valor, natureza, data, contaId, status } = req.body;
    const conta = await pool.query('SELECT id FROM contas WHERE id = $1 AND removido = FALSE', [contaId]);
    if (!conta.rowCount) return res.status(400).json({ message: 'Selecione uma conta ativa.' });
    const updated = await pool.query(
      'UPDATE lancamentos SET descricao = $1, valor = $2, natureza = $3, data = $4, conta_id = $5, status = $6 WHERE id = $7 AND removido = FALSE RETURNING id',
      [descricao.trim(), valor, natureza, data, contaId, status, req.params.id],
    );
    if (!updated.rowCount) return res.status(404).json({ message: 'Lançamento não encontrado.' });
    const { rows } = await pool.query(`SELECT ${fields} ${source} WHERE l.id = $1`, [req.params.id]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('UPDATE lancamentos SET removido = TRUE WHERE id = $1 AND removido = FALSE RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Lançamento não encontrado.' });
    res.json({ message: 'Lançamento removido com sucesso.' });
  } catch (error) { next(error); }
});

export default router;
