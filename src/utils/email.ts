import nodemailer from 'nodemailer';

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Gửi thông báo cho ADMIN khi có người vừa bấm đặt đơn (Trạng thái PENDING)
 */
export const sendAdminOrderNotification = async (order: any) => {
  console.log(`[Admin Alert] Đang gửi thông báo đơn hàng mới cho Admin...`);
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  try {
    const { fullName, user, phoneNumber, address, items, totalAmount, depositAmount, depositRate, orderCode, _id } = order;
    const remainingAmount = totalAmount - depositAmount;
    const transferCode = `HP ${orderCode || _id.toString().slice(-8).toUpperCase()}`;
    const isFullPayment = depositRate >= 0.99;
    
    const adminMailOptions = {
      from: `"HỆ THỐNG HAIPHUC" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `🚨 ${isFullPayment ? 'THANH TOÁN FULL' : 'ĐƠN CHỜ CỌC'}: ${fullName.toUpperCase()} [${transferCode}]`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 30px; border: 10px solid #000; max-width: 700px; margin: auto; color: #000;">
          <h2 style="color: #ff0000; text-align: center; font-size: 24px; text-transform: uppercase;">${isFullPayment ? 'ĐƠN HÀNG THANH TOÁN 100%' : 'THÔNG BÁO ĐƠN HÀNG MỚI'}</h2>
          <hr style="border: 2px solid #000;">
          
          <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 5px solid #ff0000;">
             <p style="font-size: 14px; opacity: 0.7;"><strong>MÃ ĐƠN HÀNG (ID):</strong> #${_id.toString().toUpperCase()}</p>
             <p style="font-size: 18px;"><strong>NỘI DUNG CHUYỂN KHOẢN:</strong> <span style="background: #ff0000; color: #fff; padding: 5px 10px; font-weight: bold;">${transferCode}</span></p>
             <hr>
             <p><strong>KHÁCH HÀNG:</strong> ${fullName}</p>
             <p><strong>LIÊN HỆ (FB/ZALO/IG):</strong> 
                ${user.startsWith('http') 
                  ? `<a href="${user}" style="color: #ff0000; font-weight: bold; text-decoration: underline;">BẤM VÀO ĐÂY ĐỂ CHAT</a>` 
                  : `<span style="color: #ff0000; font-weight: bold;">${user}</span>`}
             </p>
             <p><strong>SỐ ĐIỆN THOẠI:</strong> ${phoneNumber}</p>
             <p><strong>ĐỊA CHỈ:</strong> ${address}</p>
             <p><strong>TỶ LỆ THANH TOÁN:</strong> <span style="color: #ff0000; font-weight: bold;">${isFullPayment ? '100% (BANK FULL)' : '70% (CỌC)'}</span></p>
          </div>

          <h3>DANH SÁCH SẢN PHẨM:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #000; color: #fff;">
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px;">Size/Màu</th>
                <th style="padding: 10px; text-align: center;">SL</th>
                <th style="padding: 10px; text-align: right;">Đơn giá</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((i: any) => `
                <tr style="border-bottom: 1px solid #ddd;">
                   <td style="padding: 10px;">
                    <div style="display: flex; align-items: center;">
                       <img src="${i.imageUrl || (i.product?.images && i.product.images[0]?.url) || 'https://placehold.co/50x50'}" 
                            style="width: 50px; height: 50px; object-cover: cover; margin-right: 10px; border: 1px solid #eee;">
                       <span>${i.product?.name || 'Sản phẩm'}</span>
                    </div>
                  </td>
                  <td style="padding: 10px; text-align: center;">${i.size || 'N/A'} / ${i.color || 'N/A'}</td>
                  <td style="padding: 10px; text-align: center;">x${i.quantity}</td>
                  <td style="padding: 10px; text-align: right;">${i.price.toLocaleString()}đ</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 25px; padding: 20px; background: #000; color: #fff; text-align: right;">
             <p style="margin: 5px 0; font-size: 16px;">TỔNG CỘNG: <strong>${totalAmount.toLocaleString()}đ</strong></p>
             <p style="margin: 5px 0; color: #00ff00; font-size: 18px;">${isFullPayment ? 'KHÁCH THANH TOÁN FULL' : 'KHÁCH CẦN CỌC'}: <strong>${depositAmount.toLocaleString()}đ</strong></p>
             <p style="margin: 5px 0; color: #ff4d4d; font-size: 14px;">CÒN LẠI (COD): <strong>${remainingAmount.toLocaleString()}đ</strong></p>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <a href="http://localhost:4200/h4iphuc-secret-admin/orders" style="display: inline-block; background: #000; color: #fff; padding: 15px 25px; text-decoration: none; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; border: 2px solid #000;">XÁC NHẬN TRONG ADMIN</a>
          </div>
        </div>
      `
    };

    await transporter.sendMail(adminMailOptions);
    console.log(`[Admin Alert] Đã báo cho đại ca thành công!`);
  } catch (error) {
    console.error('[Admin Alert Error]', error);
  }
};

/**
 * Gửi thông báo cho KHÁCH HÀNG khi vừa đặt đơn thành công (Trạng thái PENDING)
 */
export const sendOrderReceivedEmail = async (order: any) => {
  console.log(`[Email] Gửi mail xác nhận đơn chờ xử lý cho: ${order.email}...`);
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  try {
    const { fullName, email, items, totalAmount, depositAmount, depositRate, orderCode, paymentMethod, _id } = order;
    const transferCode = `HP ${orderCode || _id.toString().slice(-8).toUpperCase()}`;
    const isFullPayment = depositRate >= 0.99;
    
    // Tạo danh sách món đồ
    const itemRows = items.map((i: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">
          <div style="display: flex; align-items: center;">
            <img src="${i.imageUrl || (i.product?.images && i.product.images[0]?.url) || 'https://placehold.co/40x40'}" 
                 style="width: 40px; height: 40px; object-fit: cover; margin-right: 10px; border: 1px solid #eee;">
            <span>${i.product?.name || 'Sản phẩm'}</span>
          </div>
        </td>
        <td style="padding: 10px; text-align: center;">${i.size || 'N/A'} / ${i.color || 'N/A'}</td>
        <td style="padding: 10px; text-align: center;">x${i.quantity}</td>
        <td style="padding: 10px; text-align: right;">${i.price.toLocaleString()}đ</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"HẢI PHÚC SHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔥 ${isFullPayment ? 'THANH TOÁN 100%' : 'ĐẶT ĐƠN THÀNH CÔNG'}: #${orderCode || _id.toString().slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; border: 10px solid #000; padding: 30px; color: #000;">
          <h2 style="text-align: center; font-size: 26px; text-transform: uppercase; margin-bottom: 10px;">${isFullPayment ? 'XÁC NHẬN THANH TOÁN FULL' : 'XÁC NHẬN ĐƠN HÀNG'}</h2>
          <p style="text-align: center; margin-bottom: 30px;">Chào <strong>${fullName}</strong>, cảm ơn đại ca đã tin tưởng shop.</p>
          
          <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border: 1px solid #ddd;">
            <p><strong>Mã đơn hàng:</strong> #${orderCode || _id.toString().toUpperCase()}</p>
            <p><strong>Trạng thái:</strong> <span style="color: #ff0000; font-weight: bold;">${isFullPayment ? 'CHỜ BANK FULL' : 'CHỜ THANH TOÁN CỌC'}</span></p>
            <p><strong>Phương thức:</strong> ${paymentMethod}</p>
          </div>

          <h3 style="border-bottom: 2px solid #000; padding-bottom: 5px;">CHI TIẾT ĐƠN HÀNG:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
             <thead>
                <tr style="background: #eee;">
                   <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                   <th style="padding: 10px;">Size/Màu</th>
                   <th style="padding: 10px; text-align: center;">SL</th>
                   <th style="padding: 10px; text-align: right;">Giá</th>
                </tr>
             </thead>
             <tbody>
                ${itemRows}
             </tbody>
          </table>

          <div style="text-align: right; margin-top: 20px; border-top: 2px solid #000; padding-top: 15px;">
             <p style="font-size: 16px; margin: 5px 0;">Tổng đơn: <strong>${totalAmount.toLocaleString()}đ</strong></p>
             <p style="font-size: 20px; color: #ff0000; margin: 5px 0;">${isFullPayment ? 'SỐ TIỀN CẦN THANH TOÁN (100%)' : 'SỐ TIỀN CẦN CỌC (70%)'}: <strong>${depositAmount.toLocaleString()}đ</strong></p>
          </div>

          <div style="margin-top: 35px; padding: 20px; border: 3px solid #ff0000; background: #fff5f5; text-align: center;">
             <p style="font-weight: bold; font-size: 18px; margin-top: 0; color: #ff0000;">HƯỚNG DẪN THANH TOÁN</p>
             <p>STK: <strong>0972221123</strong> (MB BANK)</p>
             <p>Chủ TK: <strong>PHAM HAI PHUC</strong></p>
             <p style="font-size: 20px;">Nội dung: <strong style="background: #ff0000; color: #fff; padding: 2px 10px;">${transferCode}</strong></p>
             <p style="font-size: 12px; font-style: italic; margin-top: 10px;">(Vui lòng ghi đúng nội dung để đơn được duyệt tự động nhanh nhất)</p>
          </div>

          <p style="font-size: 12px; margin-top: 40px; opacity: 0.6; text-align: center;">Sau khi nhận được tiền, Shop sẽ tiến hành xử lý ngay cho đại ca!</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] Đã gửi mail xác nhận cho khách ${fullName}.`);
  } catch (error) {
    console.error('[Email Error]', error);
  }
};

/**
 * Gửi thông báo cho KHÁCH HÀNG khi đã xác nhận thanh toán cọc (Trạng thái DEPOSITED)
 */
export const sendOrderEmail = async (order: any) => {
  console.log(`[Email] Bắt đầu xử lý gửi mail cho khách: ${order.email}...`);
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[Email Error] Thiếu cấu hình EMAIL_USER hoặc EMAIL_PASS trong .env!');
    return;
  }

  try {
    const { fullName, email, items, totalAmount, depositAmount, depositRate, orderCode, _id } = order;
    const isFullPayment = depositRate >= 0.99;

    const itemRows = items.map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">
          <div style="display: flex; align-items: center;">
            <img src="${item.imageUrl || (item.product?.images && item.product.images[0]?.url) || 'https://placehold.co/40x40'}" 
                 style="width: 40px; height: 40px; object-fit: cover; margin-right: 10px; border: 1px solid #eee;">
            <span>${item.product?.name || 'Sản phẩm'}</span>
          </div>
        </td>
        <td style="padding: 10px; text-align: center;">${item.size || 'N/A'} / ${item.color || 'N/A'}</td>
        <td style="padding: 10px; text-align: center;">x${item.quantity}</td>
        <td style="padding: 10px; text-align: right;">${item.price.toLocaleString()}đ</td>
      </tr>
    `).join('');

    const customerMailOptions = {
      from: `"HẢI PHÚC SHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ XÁC NHẬN ${isFullPayment ? 'THANH TOÁN FULL' : 'TIỀN CỌC'}: #${orderCode || _id.toString().slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: 'Helvetica', Arial, sans-serif; color: #000; max-width: 650px; margin: auto; border: 10px solid #000; padding: 30px;">
          <h1 style="text-align: center; font-size: 28px; letter-spacing: 2px; border-bottom: 2px solid #000; padding-bottom: 20px; text-transform: uppercase;">${isFullPayment ? 'ĐÃ NHẬN THANH TOÁN 100%' : 'TIỀN CỌC ĐÃ ĐƯỢC XÁC NHẬN'}</h1>
          
          <p>Chào <strong>${fullName.toUpperCase()}</strong>, Shop đã nhận được khoản thanh toán của đại ca. Đơn hàng hiện đang được xử lý.</p>
          
          <div style="background: #f4f4f4; padding: 20px; margin: 25px 0;">
            <h3 style="margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 10px;">TÓM TẮT ĐƠN HÀNG</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #000; color: #fff;">
                  <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                  <th style="padding: 10px;">Màu/Size</th>
                  <th style="padding: 10px;">SL</th>
                  <th style="padding: 10px;">Giá</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          </div>

          <div style="text-align: right; line-height: 1.8;">
            <p>Tổng giá trị: <strong>${totalAmount.toLocaleString()}đ</strong></p>
            <p style="color: #00aa00; font-size: 18px;">${isFullPayment ? 'Đã thanh toán (100%)' : 'Đã thanh toán cọc (70%)'}: <strong>${depositAmount.toLocaleString()}đ</strong></p>
            <p style="border-top: 1px solid #000; padding-top: 10px; font-size: 18px;">Số tiền còn lại (COD): <strong>${(totalAmount - depositAmount).toLocaleString()}đ</strong></p>
          </div>

          <div style="margin-top: 35px; border-left: 5px solid #00aa00; padding-left: 20px; background: #f0fff0; padding-top: 10px; padding-bottom: 10px;">
            <p><strong>DỰ KIẾN GIAO HÀNG:</strong> 7-10 ngày làm việc (với hàng ORDER).</p>
            <p>Chúng tôi sẽ gửi mail thông báo kèm <strong>MÃ VẬN ĐƠN</strong> ngay khi hàng được gửi đi.</p>
          </div>

          <p style="text-align: center; margin-top: 50px; font-size: 11px; color: #888;">&copy; 2024 HAIPHUC SHOP | HÀNG ORDER CAO CẤP</p>
        </div>
      `
    };

    await transporter.sendMail(customerMailOptions);
    console.log(`[Email] Đã gửi thông báo đơn hàng thành công cho ${fullName}.`);
  } catch (error) {
    console.error('[Email Error]', error);
  }
};
