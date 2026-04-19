import { Router } from 'express';
import { upload } from '../config/cloudinary';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController';

const router = Router();

// GET: Lấy danh sách sản phẩm
router.get('/', getProducts);

// POST: Thêm sản phẩm mới (Có xử lý upload ảnh)
router.post('/', upload.single('image'), createProduct);

// PUT: Cập nhật sản phẩm theo ID
router.put('/:id', updateProduct);

// DELETE: Xóa sản phẩm theo ID
router.delete('/:id', deleteProduct);

export default router;
