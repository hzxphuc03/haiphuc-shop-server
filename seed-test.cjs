const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ProductSchema = new mongoose.Schema({
  name: String,
  priceVND: Number,
  description: String,
  category: String,
  type: String,
  stock: Number,
  images: [{ url: String, color: String }],
  sizes: [String],
  colors: [String]
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('Không tìm thấy MONGODB_URI trong .env');

    await mongoose.connect(uri);
    console.log('✅ Đã kết nối MongoDB thành công!');

    const categories = ['Giày', 'Quần', 'Áo', 'Phụ kiện'];
    const dummyProducts = [];

    for (let i = 1; i <= 20; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        dummyProducts.push({
            name: `Test Nike Gear #${i} [${cat}]`,
            priceVND: Math.floor(Math.random() * 4000000) + 600000,
            description: `Sản phẩm dùng để kiểm tra tính năng phân trang. Chất lượng chuẩn Nike Museum.`,
            category: cat,
            type: i % 2 === 0 ? 'READY' : 'ORDER',
            stock: 99,
            images: [{ 
                url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800', 
                color: 'Black' 
            }],
            sizes: ['39', '40', '41'],
            colors: ['Red', 'Black']
        });
    }

    await Product.insertMany(dummyProducts);
    console.log('🚀 BƠM THÀNH CÔNG 20 SẢN PHẨM TEST! ĐẠI CA F5 LẠI UI NHÉ.');
    process.exit();
  } catch (error) {
    console.error('❌ Lỗi rồi đại ca ơi:', error);
    process.exit(1);
  }
}

seed();
