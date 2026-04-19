import { Router } from 'express';
import { createOrder, getAllOrders, getMyOrders, updateOrderStatus, deleteOrder } from '../controllers/orderController';

const router = Router();

router.post('/', createOrder);
router.get('/', getAllOrders); // For Admin
router.get('/my', getMyOrders);
router.put('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

export default router;
