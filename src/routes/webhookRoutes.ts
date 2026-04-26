import { Router } from 'express';
import { handlePaymentWebhook } from '../controllers/webhookController.js';

const router = Router();

// POST /api/v1/webhooks/payment
router.post('/payment', handlePaymentWebhook);

export default router;
