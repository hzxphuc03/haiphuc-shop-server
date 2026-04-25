import { Router } from 'express';
import { 
  login, 
  register, 
  googleLogin, 
  facebookLogin, 
  getMe, 
  refreshToken, 
  logout 
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng ký tài khoản mới
 *     security: []
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 */
router.post('/register', register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập hệ thống
 *     security: []
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về cookie HttpOnly
 */
router.post('/login', login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Lấy thông tin tài khoản hiện tại (Dùng Cookie)
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/me', authenticate, getMe);

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Làm mới Access Token (Dùng Refresh Cookie)
 *     responses:
 *       200:
 *         description: Cấp cặp token mới thành công
 */
router.post('/refresh-token', refreshToken);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng xuất và xóa Cookie
 */
router.post('/logout', authenticate, logout);

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập bằng Google
 */
router.post('/google', googleLogin);

/**
 * @openapi
 * /api/auth/facebook:
 *   post:
 *     tags: [Authentication]
 *     summary: Đăng nhập bằng Facebook
 */
router.post('/facebook', facebookLogin);

export default router;
