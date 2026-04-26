import dotenv from 'dotenv';
dotenv.config();

/**
 * Tập trung quản lý toàn bộ biến môi trường
 * Đảm bảo nguyên tắc "No Hardcode"
 */
export const config = {
  port: process.env.PORT || 5005,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/haiphuc-shop',
  jwtSecret: process.env.JWT_SECRET || 'haiphuc-shop-super-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'haiphuc-shop-refresh-secret-key',
  jwtExpiresIn: '24h',
  jwtRefreshExpiresIn: '7d',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'haiphuc-shop-products'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  },
  facebook: {
    appId: process.env.FB_APP_ID || ''
  },
  admin: {
    user: process.env.ADMIN_USER,
    pass: process.env.ADMIN_PASS
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:4200', 'https://haiphuc-shop.vercel.app']
  },
  ghtk: {
    apiToken: process.env.GHTK_API_TOKEN || '',
    baseUrl: process.env.GHTK_BASE_URL || 'https://services.giaohangtietkiem.vn'
  },
  payment: {
    webhookToken: process.env.CASSO_WEBHOOK_TOKEN || 'hp-secure-token-2024',
    bankName: process.env.BANK_NAME || 'MB BANK',
    bankAccount: process.env.BANK_ACCOUNT || '0972221123',
    accountName: process.env.ACCOUNT_NAME || 'PHAM HAI PHUC'
  }
};
