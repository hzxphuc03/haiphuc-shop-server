import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string
});

// Thiết lập nơi lưu trữ trên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'haiphuc-shop-products', // Tên thư mục trên Cloudinary
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: `product-${Date.now()}`, // Tên file duy nhất
    };
  },
});

// Tạo Middleware upload
export const upload = multer({ storage: storage });
