import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const JWT_SECRET = process.env.JWT_SECRET || 'haiphuc-shop-super-secret-key';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      // Tạo token ber hạn trong 24h
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
      res.status(200).json({ token, message: 'Đăng nhập thành công' });
    } else {
      res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
