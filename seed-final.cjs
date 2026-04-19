const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// Định nghĩa Schema khớp 100% với Product.ts
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  priceVND: { type: Number, required: true },
  category: { type: String, required: true },
  sizes: { type: [String], required: true },
  colors: { type: [String], required: true },
  images: [{
    url: { type: String, required: true },
    color: { type: String, default: 'All' }
  }],
  stock: { type: Number, default: 0 },
  type: { type: String, enum: ['READY', 'ORDER'], default: 'READY' }
}, { timestamps: true, versionKey: false });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối DB');

    // 1. XÓA SẠCH DỮ LIỆU CŨ (Để tránh rác)
    await Product.deleteMany({});
    console.log('🗑️ Đã dọn sạch kho hàng lỗi.');

    const categories = ['Giày', 'Quần', 'Áo', 'Phụ kiện'];
    const dummy = [];

    for (let i = 1; i <= 20; i++) {
      const cat = categories[Math.floor(Math.random() * categories.length)];
      dummy.push({
        name: `Nike Legacy Gear #${i} [${cat}]`,
        priceVND: Math.floor(Math.random() * 2000000) + 500000,
        description: 'Sản phẩm cao cấp từ bộ sưu tập Hải Phúc Shop Production.',
        category: cat,
        sizes: ['M', 'L', 'XL'],
        colors: ['Black', 'White'],
        stock: 50,
        type: i % 2 === 0 ? 'READY' : 'ORDER',
        images: [{
          url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
          color: 'Black'
        }]
      });
    }

    await Product.insertMany(dummy);
    console.log('🚀 ĐÁNH BÓNG KHO HÀNG THÀNH CÔNG! 20 SIÊU PHẨM CÓ ẢNH ĐÃ SẴN SÀNG.');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
