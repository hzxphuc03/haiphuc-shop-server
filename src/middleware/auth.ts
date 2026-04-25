import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    username: string;
  };
}

/**
 * Middleware xác thực Token (Hỗ trợ cả Header và Cookie)
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Debug log để check Cookie (Xóa khi lên prod)
  console.log('🍪 [Auth Middleware] Cookies received:', req.cookies);

  // 1. Lấy token từ Cookie hoặc Authorization Header
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Truy cập bị từ chối. Vui lòng đăng nhập.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token đã hết hạn.', code: 'TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ error: 'Token không hợp lệ.' });
    }
  }
};

/**
 * Middleware phân quyền linh hoạt (Role-based)
 * @param roles Mảng các role được phép truy cập (e.g. ['admin', 'member'])
 */
export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Yêu cầu xác thực tài khoản.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Quyền truy cập bị từ chối. Cần quyền: [${roles.join(', ')}]` 
      });
      return;
    }

    next();
  };
};

/**
 * Middleware cũ (Duy trì tính tương thích)
 */
export const isAdmin = checkRole(['admin']);
