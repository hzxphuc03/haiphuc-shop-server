import { Router } from 'express';
import { login, register, googleLogin, facebookLogin } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/google
router.post('/google', googleLogin);

// POST /api/auth/facebook
router.post('/facebook', facebookLogin);

export default router;
