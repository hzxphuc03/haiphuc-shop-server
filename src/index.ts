import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { config } from './config/index.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

const app = express();

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép nếu không có origin (như curl hoặc server-to-server)
    // Hoặc nếu nó nằm trong danh sách fix cứng hoặc subdomain của Vercel
    if (!origin || config.cors.allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Chừa cái thói truy cập trái phép nha! (CORS)'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Haiphuc Shop API is running...');
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
