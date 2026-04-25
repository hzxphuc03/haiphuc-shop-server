import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import axios from 'axios';
import User, { type IUser } from '../models/User.js';
import { config } from '../config/index.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

const googleClient = new OAuth2Client(config.google.clientId);

/**
 * Tạo bộ đôi Access Token và Refresh Token
 */
const generateTokens = (user: IUser) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn as any }
  );

  return { accessToken, refreshToken };
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, email, fullName]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *               email: { type: string }
 *               fullName: { type: string }
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ 
      $or: [{ email: validatedData.email }, { username: validatedData.username }] 
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email hoặc tên đăng nhập đã tồn tại' });
    }

    const newUser = await User.create({
      username: validatedData.username,
      password: validatedData.password,
      email: validatedData.email,
      fullName: validatedData.fullName,
      avatar: validatedData.avatar || '',
      provider: 'local',
      role: 'user'
    }) as IUser;

    const { accessToken, refreshToken } = generateTokens(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    return res.status(201).json({
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        avatar: newUser.avatar
      },
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập truyền thống
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Thông tin đăng nhập không chính xác' });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar
      },
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Đăng nhập bằng Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string }
 *     responses:
 *       200:
 *         description: Đăng nhập Google thành công
 */
export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  try {
    console.log('--- DEBUG GOOGLE LOGIN ---');
    console.log('ID Token received:', idToken ? (idToken.substring(0, 20) + '...') : 'MISSING');
    console.log('Expected Client ID (Config):', config.google.clientId);
    
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId as string,
    });

    const payload = ticket.getPayload() as TokenPayload;
    console.log('Google Payload Success:', payload?.email);
    
    if (!payload) return res.status(400).json({ message: 'Google Token không hợp lệ' });

    const { sub, email, name, picture } = payload;

    if (!email) return res.status(400).json({ message: 'Google account không cung cấp email' });

    let user = await User.findOne({ email: email as string }) as (IUser | null);

    if (user) {
      user.socialId = sub;
      user.provider = 'google';
      if (!user.avatar) user.avatar = picture || '';
      await user.save();
    } else {
      user = await User.create({
        email: email as string,
        fullName: name || 'Google User',
        avatar: picture || '',
        socialId: sub,
        provider: 'google',
        role: 'user'
      }) as IUser;
    }

    const { accessToken, refreshToken } = generateTokens(user!);
    user!.refreshToken = refreshToken;
    await user!.save();

    return res.json({
      user: {
        id: user!._id,
        email: user!.email,
        fullName: user!.fullName,
        role: user!.role,
        avatar: user!.avatar
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ message: 'Xác thực Google thất bại' });
  }
};

/**
 * @swagger
 * /api/auth/facebook:
 *   post:
 *     summary: Đăng nhập bằng Facebook
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accessToken]
 *             properties:
 *               accessToken: { type: string }
 *     responses:
 *       200:
 *         description: Đăng nhập Facebook thành công
 */
export const facebookLogin = async (req: Request, res: Response) => {
  const { accessToken: fbAccessToken } = req.body;

  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${fbAccessToken}`
    );

    const { id, name, email, picture } = data;

    if (!email && !id) return res.status(400).json({ message: 'Facebook không trả về thông tin định danh' });

    const targetEmail = email || `${id}@facebook.com`;

    let user = await User.findOne({ email: targetEmail }) as (IUser | null);

    if (user) {
      user.socialId = id as string;
      user.provider = 'facebook';
      if (!user.avatar) user.avatar = picture?.data?.url || '';
      await user.save();
    } else {
      user = await User.create({
        email: targetEmail,
        fullName: name || 'Facebook User',
        avatar: picture?.data?.url || '',
        socialId: id as string,
        provider: 'facebook',
        role: 'user'
      }) as IUser;
    }

    const { accessToken, refreshToken } = generateTokens(user!);
    user!.refreshToken = refreshToken;
    await user!.save();

    return res.json({
      user: {
        id: user!._id,
        email: user!.email,
        fullName: user!.fullName,
        role: user!.role,
        avatar: user!.avatar
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Facebook Auth Error:', error);
    return res.status(500).json({ message: 'Xác thực Facebook thất bại' });
  }
};
