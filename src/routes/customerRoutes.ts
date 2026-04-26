import { Router } from 'express';
import { authenticate, checkRole } from '../middleware/auth.js';
import { CustomerController } from '../controllers/customerController.js';

const router = Router();

// Tất cả route trong này đều yêu cầu Admin
router.use(authenticate, checkRole(['admin']));

/**
 * GET /api/admin/customers
 * Lấy danh sách khách hàng
 */
router.get('/', CustomerController.getAll);

/**
 * GET /api/admin/customers/:id
 * Lấy chi tiết khách hàng
 */
router.get('/:id', CustomerController.getById);

/**
 * PATCH /api/admin/customers/:id/status
 * Cập nhật trạng thái tài khoản
 */
router.patch('/:id/status', CustomerController.updateStatus);

/**
 * DELETE /api/admin/customers/:id
 * Xóa mềm khách hàng
 */
router.delete('/:id', CustomerController.delete);

export default router;
