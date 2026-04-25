import { Router } from 'express';
import { upload } from '../config/cloudinary.js';
import { authenticate, checkRole } from '../middleware/auth.js';
import { 
  getProducts, 
  getProductById,
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';

const router = Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Lấy danh sách sản phẩm có phân trang
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', getProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Lấy chi tiết sản phẩm
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/:id', getProductById);

/**
 * @openapi
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Tạo sản phẩm mới (Admin)
 *     security: [{ cookieAuth: [] }]
 *     responses:
 *       201:
 *         description: Đã tạo
 */
router.post('/', authenticate, checkRole(['admin']), upload.array('images', 6), createProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Cập nhật sản phẩm (Admin)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.put('/:id', authenticate, checkRole(['admin']), upload.array('images', 6), updateProduct);

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Xóa sản phẩm (Admin)
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 */
router.delete('/:id', authenticate, checkRole(['admin']), deleteProduct);

export default router;
