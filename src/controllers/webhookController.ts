import type { Request, Response } from 'express';
import Order from '../models/Order.js';
import payos from '../utils/payos.js';
import fs from 'fs';
import path from 'path';

/**
 * Xử lý Webhook từ PayOS (Mới)
 * Luồng: Nhận data -> Xác thực chữ ký -> Cập nhật trạng thái
 */
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  const logFilePath = path.join(process.cwd(), 'webhook-debug.log');

  try {
    // GHI LOG VÀO FILE ĐỂ CHECK TRÊN PRODUCTION
    const logData = `
-------------------------------------------
🚀 [PAYOS WEBHOOK] INCOMING AT: ${new Date().toISOString()}
📦 BODY: ${JSON.stringify(req.body, null, 2)}
-------------------------------------------
`;
    fs.appendFileSync(logFilePath, logData);

    const webhookData = req.body;

    // 1. Xác thực webhook từ PayOS (Nếu là test hoặc chưa cài checksum key thì có thể skip bước này)
    // Nhưng trên Prod BẮT BUỘC phải dùng verifyPaymentWebhookData
    try {
        const verifiedData = await payos.webhooks.verify(webhookData);
        console.log('✅ Webhook Verified:', verifiedData);

        // data.orderCode từ PayOS trả về là mã đơn hàng (số) mà mình đã gửi lên
        // Lưu ý: PayOS orderCode phải là kiểu Number
        const { orderCode, code } = verifiedData;

        if (code === '00') {
            // Tìm đơn hàng trong DB theo paymentLinkId (Mã số mà mình gửi sang PayOS)
            const order = await Order.findOne({ paymentLinkId: orderCode.toString() });

            if (order) {
                order.paymentStatus = 'DEPOSITED';
                order.status = 'DEPOSITED';
                // @ts-ignore
                order.paidAt = new Date();
                await order.save();
                
                const successMsg = `✅ Order ${orderCode} PAID SUCCESS!\n`;
                fs.appendFileSync(logFilePath, successMsg);
            } else {
                fs.appendFileSync(logFilePath, `❌ No order found for PayOS code: ${orderCode}\n`);
            }
        }
    } catch (verifyError: any) {
        fs.appendFileSync(logFilePath, `⚠️ Webhook Verify Failed: ${verifyError.message}\n`);
        // Vẫn trả về 200 để PayOS không gửi lại nếu là lỗi do dev/config
    }

    // PayOS yêu cầu trả về HTTP 200
    res.status(200).json({ error: 0, message: "Ok" });

  } catch (error: any) {
    const errorMsg = `🔥 Webhook Error: ${error.message}\n`;
    fs.appendFileSync(logFilePath, errorMsg);
    res.status(500).json({ error: error.message });
  }
};
