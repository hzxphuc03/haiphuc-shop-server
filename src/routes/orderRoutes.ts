import { Router } from 'express';
import { createOrder, getAllOrders, getMyOrders, updateOrderStatus, deleteOrder, getOrderById } from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', createOrder);
router.get('/', getAllOrders); // For Admin
router.get('/my', authenticate, getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

export default router;
