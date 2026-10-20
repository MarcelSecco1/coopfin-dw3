import { pool } from '../../../database/pool.js';

const fields = `id, nome, tipo, instituicao, saldo_inicial AS "saldoInicial", removido, criado_em AS "criadoEm"`;

export const getAllContas = async () => {
  const { rows } = await pool.query(`SELECT ${fields} FROM contas WHERE removido = FALSE ORDER BY nome`);
  return rows;
};

export const getContaByID = async (id) => {
  const { rows } = await pool.query(`SELECT ${fields} FROM contas WHERE id = $1 AND removido = FALSE`, [id]);
  return rows[0];
};

export const insertConta = async ({ nome, tipo, instituicao, saldoInicial }) => {
  const { rows } = await pool.query(
    `INSERT INTO contas (nome, tipo, instituicao, saldo_inicial) VALUES ($1, $2, $3, $4) RETURNING ${fields}`,
    [nome.trim(), tipo, (instituicao ?? '').trim(), saldoInicial ?? 0],
  );
  return rows[0];
};

export const updateConta = async (id, { nome, tipo, instituicao, saldoInicial }) => {
  const { rows } = await pool.query(
    `UPDATE contas SET nome = $1, tipo = $2, instituicao = $3, saldo_inicial = $4 WHERE id = $5 AND removido = FALSE RETURNING ${fields}`,
    [nome.trim(), tipo, (instituicao ?? '').trim(), saldoInicial ?? 0, id],
  );
  return rows[0];
};

export const deleteConta = async (id) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('UPDATE contas SET removido = TRUE WHERE id = $1 AND removido = FALSE RETURNING id', [id]);
    if (rows[0]) await client.query('UPDATE lancamentos SET removido = TRUE WHERE conta_id = $1 AND removido = FALSE', [id]);
    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
