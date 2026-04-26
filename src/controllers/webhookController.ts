import type { Request, Response } from 'express';
import Order from '../models/Order.js';
import { config } from '../config/index.js';

/**
 * Xử lý Webhook từ Casso/SePay
 * Luồng: Nhận data -> Parse mã đơn -> Đối soát tiền -> Cập nhật trạng thái
 */
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    // 1. Bảo mật: Kiểm tra Secure-Token
    const secureToken = req.headers['secure-token'];
    
    // LOG MẠNH ĐỂ SOI DATA THỰC TẾ TỪ CASSO
    console.log('-------------------------------------------');
    console.log('🚀 [WEBHOOK] INCOMING REQUEST AT:', new Date().toISOString());
    console.log('📦 BODY:', JSON.stringify(req.body, null, 2));
    console.log('🔑 HEADERS:', JSON.stringify(req.headers, null, 2));
    console.log('-------------------------------------------');

    if (secureToken !== config.payment.webhookToken) {
       console.error('❌ Webhook Token không khớp!');
       return res.status(401).json({ error: 1, message: 'Token invalid' });
    }

    const { data } = req.body; 
    if (!data || !Array.isArray(data)) {
      return res.status(200).json({ error: 0, message: 'Data empty or not array' });
    }

    const results = [];

    for (const transaction of data) {
      const description = transaction.description || '';
      const amount = transaction.amount || 0;

      console.log(`🔍 Processing: "${description}" | Amount: ${amount}`);

      // 2. RegEx siêu linh hoạt: Tìm HP/HPSHOP theo sau là mã 6-10 ký tự
      // Bắt được: "HP123456", "HP 123456", "Thanh toan HP 123456", v.v.
      const match = description.match(/(?:HP|HPSHOP|HAIPHUC)\s*([A-Z0-9]{6,10})/i);
      
      if (match) {
        const orderCode = match[1].toUpperCase();
        console.log(`🎯 Found Order Code: ${orderCode}`);
        
        // 3. Tìm đơn hàng trong DB
        const order = await Order.findOne({ orderCode });

        if (order) {
          const requiredAmount = order.depositAmount;
          console.log(`📊 DB Match: ${order._id} | Required: ${requiredAmount}`);

          if (amount >= requiredAmount) {
            // 4. Cập nhật trạng thái đơn hàng
            order.paymentStatus = 'DEPOSITED';
            order.status = 'DEPOSITED';
            // @ts-ignore
            order.paidAt = new Date(); 
            
            await order.save();
            console.log(`✅ Order ${orderCode} UPDATED SUCCESS!`);
            results.push({ orderCode, status: 'SUCCESS' });
          } else {
            console.warn(`⚠️ Amount mismatch: Got ${amount}, Need ${requiredAmount}`);
            results.push({ orderCode, status: 'PARTIAL' });
          }
        } else {
          console.warn(`❌ No order found in DB with code: ${orderCode}`);
          results.push({ orderCode, status: 'NOT_FOUND' });
        }
      } else {
        console.log(`ℹ️ Ignored: No HP pattern found in "${description}"`);
        results.push({ description, status: 'IGNORED' });
      }
    }

    // PHẢI TRẢ VỀ FORMAT NÀY ĐỂ CASSO/SEPAY BIẾT LÀ OK
    res.status(200).json({
      error: 0,
      message: "Ok",
      results
    });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: error.message });
  }
};
