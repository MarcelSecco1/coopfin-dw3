import { pool } from '../../../database/pool.js';

export const getUserByUsername = async (username) => {
  const { rows } = await pool.query('SELECT id, username, password_hash FROM usuarios WHERE username = $1 AND removido = FALSE', [username]);
  return rows[0];
};
