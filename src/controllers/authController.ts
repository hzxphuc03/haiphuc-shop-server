import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import axios from 'axios';
import User, { type IUser } from '../models/User.js';
import { config } from '../config/index.js';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import type { AuthRequest } from '../middleware/auth.js';

const googleClient = new OAuth2Client(config.google.clientId);

/**
 * Cấu hình Cookie chuẩn Senior Architect
 */
const cookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production', // Chỉ bật secure (HTTPS) khi ở production
  sameSite: (config.nodeEnv === 'production' ? 'none' : 'lax') as any, // 'lax' cho dev, 'none' cho production cross-domain
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
};

/**
 * Tạo bộ đôi Access Token và Refresh Token
 */
const generateTokens = (user: IUser) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role, username: user.username },
    config.jwtSecret,
    { expiresIn: '15m' } // Access Token ngắn hạn
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    config.jwtRefreshSecret,
    { expiresIn: '7d' } // Refresh Token dài hạn
  );

  return { accessToken, refreshToken };
};

/**
 * Đăng ký tài khoản
 */
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const existingUser = await User.findOne({ 
      $or: [{ email: validatedData.email }, { username: validatedData.username }] 
    });

    if (existingUser) return res.status(400).json({ message: 'Email hoặc tên đăng nhập đã tồn tại' });

    const newUser = await User.create({
      username: validatedData.username,
      email: validatedData.email,
      password: validatedData.password,
      fullName: validatedData.fullName,
      avatar: validatedData.avatar || '',
      provider: 'local',
      role: 'user'
    }) as IUser;

    const { accessToken, refreshToken } = generateTokens(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(201).json({
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

/**
 * Đăng nhập truyền thống
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

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};

/**
 * Lấy thông tin cá nhân (Check Auth)
 */
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

/**
 * Refresh Token Rotation Logic
 */
export const refreshToken = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'Không có Refresh Token' });

  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as any;
    const user = await User.findById(decoded.id);

    // Phát hiện tấn công: Refresh Token không khớp với bản ghi trong DB (đã bị dùng hoặc bị đánh cắp)
    if (!user || user.refreshToken !== token) {
      if (user) {
        user.refreshToken = ''; // Vô hiệu hóa mọi phiên làm việc
        await user.save();
      }
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(403).json({ message: 'Phát hiện truy cập trái phép. Đã vô hiệu hóa phiên làm việc.' });
    }

    // Cấp cặp Token mới (Rotation)
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

    return res.json({ success: true });
  } catch (error) {
    return res.status(403).json({ message: 'Refresh Token không hợp lệ hoặc đã hết hạn' });
  }
};

/**
 * Đăng xuất
 */
export const logout = async (req: AuthRequest, res: Response) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: '' });
  }
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.json({ message: 'Đăng xuất thành công' });
};

/**
 * Google Login (Tương tự)
 */
export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId as string,
    });
    const payload = ticket.getPayload() as TokenPayload;
    if (!payload || !payload.email) return res.status(400).json({ message: 'Google Token không hợp lệ' });

    let user = await User.findOne({ email: payload.email }) as IUser;
    if (user) {
      user.socialId = payload.sub;
      user.provider = 'google';
    } else {
      user = await User.create({
        email: payload.email,
        fullName: payload.name || 'Google User',
        avatar: payload.picture || '',
        socialId: payload.sub,
        provider: 'google',
        role: 'user'
      }) as IUser;
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json({
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Xác thực Google thất bại' });
  }
};

/**
 * Facebook Login (Tương tự)
 */
export const facebookLogin = async (req: Request, res: Response) => {
  const { accessToken: fbAccessToken } = req.body;
  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${fbAccessToken}`
    );
    const { id, name, email, picture } = data;
    const targetEmail = email || `${id}@facebook.com`;

    let user = await User.findOne({ email: targetEmail }) as IUser;
    if (user) {
      user.socialId = id;
      user.provider = 'facebook';
    } else {
      user = await User.create({
        email: targetEmail,
        fullName: name || 'Facebook User',
        avatar: picture?.data?.url || '',
        socialId: id,
        provider: 'facebook',
        role: 'user'
      }) as IUser;
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.json({
      user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Xác thực Facebook thất bại' });
  }
};
