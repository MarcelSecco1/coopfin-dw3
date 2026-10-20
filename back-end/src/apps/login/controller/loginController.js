import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as loginModel from '../model/loginModel.js';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return res.status(400).json({ message: 'Informe usuário e senha.' });
    }

    const user = await loginModel.getUserByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
    }

    const token = jwt.sign({ sub: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: { id: user.id, username: user.username } });
  } catch (error) {
    return next(error);
  }
};
