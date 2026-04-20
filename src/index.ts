import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
const allowedOrigins = [
  'http://localhost:4200', 
  'https://haiphuc-shop.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép nếu không có origin (như curl hoặc server-to-server)
    // Hoặc nếu nó nằm trong danh sách fix cứng
    // Hoặc nếu nó là subdomain của Vercel (.vercel.app)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
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
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/haiphuc-shop';

console.log('⏳ Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });
