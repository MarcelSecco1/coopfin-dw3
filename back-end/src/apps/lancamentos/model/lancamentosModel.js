import { pool } from '../../../database/pool.js';

const fields = `l.id, l.descricao, l.valor, l.natureza, TO_CHAR(l.data, 'YYYY-MM-DD') AS data, l.conta_id AS "contaId", c.nome AS "contaNome", l.status, l.removido, l.criado_em AS "criadoEm"`;
const source = 'FROM lancamentos l JOIN contas c ON c.id = l.conta_id';

export const getAllLancamentos = async () => {
  const { rows } = await pool.query(`SELECT ${fields} ${source} WHERE l.removido = FALSE ORDER BY l.data DESC, l.id DESC`);
  return rows;
};

export const getLancamentoByID = async (id) => {
  const { rows } = await pool.query(`SELECT ${fields} ${source} WHERE l.id = $1 AND l.removido = FALSE`, [id]);
  return rows[0];
};

export const insertLancamento = async ({ descricao, valor, natureza, data, contaId, status }) => {
  const { rows } = await pool.query(
    `INSERT INTO lancamentos (descricao, valor, natureza, data, conta_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [descricao.trim(), valor, natureza, data, contaId, status],
  );
  return getLancamentoByID(rows[0].id);
};

export const updateLancamento = async (id, { descricao, valor, natureza, data, contaId, status }) => {
  const { rowCount } = await pool.query(
    'UPDATE lancamentos SET descricao = $1, valor = $2, natureza = $3, data = $4, conta_id = $5, status = $6 WHERE id = $7 AND removido = FALSE',
    [descricao.trim(), valor, natureza, data, contaId, status, id],
  );
  return rowCount ? getLancamentoByID(id) : undefined;
};

export const deleteLancamento = async (id) => {
  const { rows } = await pool.query('UPDATE lancamentos SET removido = TRUE WHERE id = $1 AND removido = FALSE RETURNING id', [id]);
  return rows[0];
};

export const isAccountActive = async (contaId) => {
  const { rowCount } = await pool.query('SELECT id FROM contas WHERE id = $1 AND removido = FALSE', [contaId]);
  return rowCount > 0;
};
