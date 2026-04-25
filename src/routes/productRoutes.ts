import { Router } from 'express';
import { upload } from '../config/cloudinary.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { 
  getProducts, 
  getProductById,
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';

const router = Router();

// GET: Lấy danh sách sản phẩm (Công khai)
router.get('/', getProducts);

// GET: Lấy chi tiết một sản phẩm (Công khai)
router.get('/:id', getProductById);

// Các route bên dưới yêu cầu quyền Admin (Cần Token & Role Admin)
router.post('/', authenticate, isAdmin, upload.array('images', 6), createProduct);
router.put('/:id', authenticate, isAdmin, upload.array('images', 6), updateProduct);
router.delete('/:id', authenticate, isAdmin, deleteProduct);

export default router;
