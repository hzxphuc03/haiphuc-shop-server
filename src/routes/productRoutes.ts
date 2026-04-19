import { Router } from 'express';
import { upload } from '../config/cloudinary';
import { authAdmin } from '../middleware/auth';
import { 
  getProducts, 
  getProductById,
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController';

const router = Router();

// GET: Lấy danh sách sản phẩm (Công khai)
router.get('/', getProducts);

// GET: Lấy chi tiết một sản phẩm (Công khai)
router.get('/:id', getProductById);

// Các route bên dưới yêu cầu quyền Admin (Cần Token)
router.post('/', authAdmin, upload.array('images', 6), createProduct);
router.put('/:id', authAdmin, upload.array('images', 6), updateProduct);
router.delete('/:id', authAdmin, deleteProduct);

export default router;
