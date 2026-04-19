const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function list() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await mongoose.connection.collection('products').find({}).toArray();
    
    console.log('\n--- DANH SÁCH SẢN PHẨM HIỆN CÓ ---');
    if (products.length === 0) {
      console.log('KHO TRỐNG RỖNG!');
    } else {
      products.forEach((p, i) => {
        console.log(`${i + 1}. [ID: ${p._id}] - Tên: ${p.name}`);
      });
    }
    console.log('----------------------------------\n');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

list();
