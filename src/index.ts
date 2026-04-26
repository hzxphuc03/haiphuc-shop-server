import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import customerRoutes from './routes/customerRoutes.js';

import { config } from './config/index.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import cookieParser from 'cookie-parser';

const app = express();

// Render/Cloud Proxy Trust
app.set('trust proxy', 1);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(cookieParser());
const allowedOrigins = [
  'http://localhost:4200', 
  'http://localhost:5005', 
  'https://haiphuc-shop.vercel.app',
  'https://haiphuc-shop-git-main-phuc-hais-projects.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Chừa cái thói truy cập trái phép nha! (CORS)'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Secure-Token']
}));
app.use(express.json());

// Routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/admin/customers', customerRoutes);


// Health check
app.get('/', (req, res) => {
  res.send('Haiphuc Shop API is running...');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Endpoint [${req.method}] ${req.url} không tồn tại trên hệ thống.` 
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('💥 [Server Error]:', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// MongoDB connection
console.log('⏳ Connecting to MongoDB...');
mongoose.connect(config.mongodbUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Auto-create Admin User from .env if not exists
    if (config.admin.user && config.admin.pass) {
      const User = (await import('./models/User.js')).default;
      const adminExists = await User.findOne({ 
        $or: [{ username: config.admin.user }, { email: 'admin@haiphucshop.com' }] 
      });
      if (!adminExists) {
        console.log('👤 Creating initial Admin user from .env...');
        try {
          await User.create({
            username: config.admin.user,
            password: config.admin.pass,
            email: 'admin@haiphucshop.com',
            role: 'admin',
            fullName: 'Hải Phúc Admin'
          });
          console.log('✅ Admin user created successfully');
        } catch (err) {
          console.warn('⚠️ Admin user might already exist, skipping creation.');
        }
      }
    }

    app.listen(config.port, () => {
      console.log(`🚀 Server is running on http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
