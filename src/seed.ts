import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from './models/Product.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    const products = [];
    const categories = ['Giày', 'Quần', 'Áo', 'Phụ kiện'];
    const types = ['READY', 'ORDER'];

    for (let i = 1; i <= 20; i++) {
      products.push({
        name: `Nike Air Max Excee Test ${i}`,
        description: `Đây là sản phẩm test số ${i} của đại ca Hải Phúc. Chất liệu siêu bền, kiểu dáng Nike Museum chuẩn auth.`,
        priceVND: 1500000 + (i * 10000),
        category: categories[i % categories.length],
        type: types[i % 2],
        stock: 50 + i,
        sizes: ['38', '39', '40', '41', '42'],
        colors: ['Black', 'White', 'Blue'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
            color: 'Default'
          }
        ]
      });
    }

    await Product.insertMany(products);
    console.log('🚀 Successfully seeded 20 items to database!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
