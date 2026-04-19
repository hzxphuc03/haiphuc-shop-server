const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const ProductSchema = new mongoose.Schema({
  name: String
}, { strict: false }); // Cho phép query thoải mái

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function clean() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Đã kết nối DB');

    // Lọc các tên có chứa từ khóa Test mà đại ca đã thấy
    const query = { 
        name: { $regex: /Test Nike Gear|Nike Legacy Gear|Nike Test Item|Sản phẩm Test Nike/i } 
    };

    const count = await Product.countDocuments(query);
    if (count === 0) {
        console.log('✨ Kho hàng đã sạch sẽ, không tìm thấy sản phẩm test nào.');
    } else {
        await Product.deleteMany(query);
        console.log(`🗑️ ĐÃ QUÉT SẠCH ${count} SẢN PHẨM TEST KHỎI HỆ THỐNG!`);
    }
    
    process.exit();
  } catch (err) {
    console.error('❌ Lỗi dọn kho:', err);
    process.exit(1);
  }
}

clean();
