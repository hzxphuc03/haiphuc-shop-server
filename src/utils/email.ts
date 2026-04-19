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
    const { fullName, user, phoneNumber, address, items, totalAmount } = order;
    
    const adminMailOptions = {
      from: `"HỆ THỐNG HAIPHUC" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `🚨 ĐƠN HÀNG MỚI CHỜ CỌC: ${fullName.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 30px; border: 10px solid #000; max-width: 600px; margin: auto;">
          <h2 style="color: #ff0000; text-align: center; font-size: 24px;">CÓ ĐƠN HÀNG MỚI ĐANG CHỜ CỌC!</h2>
          <hr style="border: 2px solid #000;">
          <p><strong>KHÁCH HÀNG:</strong> ${fullName}</p>
          <p><strong>NICKNAME:</strong> ${user}</p>
          <p><strong>SỐ ĐIỆN THOẠI:</strong> ${phoneNumber}</p>
          <p><strong>ĐỊA CHỈ:</strong> ${address}</p>
          <hr style="border: 1px solid #eee;">
          <h3>CHI TIẾT GIỎ HÀNG:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${items.map((i: any) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${i.product.name}</td>
                <td style="padding: 10px; text-align: center;">${i.size}/${i.color}</td>
                <td style="padding: 10px; text-align: right;">x${i.quantity}</td>
              </tr>
            `).join('')}
          </table>
          <p style="font-size: 20px; text-align: right; margin-top: 20px;">
            <strong>TỔNG CỘNG: ${totalAmount.toLocaleString()}đ</strong>
          </p>
          <div style="margin-top: 30px; text-align: center; background: #000; padding: 15px;">
            <a href="http://localhost:4200/h4iphuc-secret-admin/orders" style="color: #fff; text-decoration: none; font-weight: bold; letter-spacing: 2px;">VÀO PHÒNG ĐIỀU HÀNH</a>
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
 * Gửi thông báo cho KHÁCH HÀNG khi đã xác nhận thanh toán cọc (Trạng thái DEPOSITED)
 */
export const sendOrderEmail = async (order: any) => {
  console.log(`[Email] Bắt đầu xử lý gửi mail cho khách: ${order.email}...`);
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('[Email Error] Thiếu cấu hình EMAIL_USER hoặc EMAIL_PASS trong .env!');
    return;
  }

  try {
    const { fullName, email, items, totalAmount, depositAmount, user } = order;

    const itemRows = items.map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">${item.product.name}</td>
        <td style="padding: 10px; text-align: center;">${item.size || 'N/A'} - ${item.color || 'N/A'}</td>
        <td style="padding: 10px; text-align: center;">x${item.quantity}</td>
        <td style="padding: 10px; text-align: right;">${item.price.toLocaleString()}đ</td>
      </tr>
    `).join('');

    const customerMailOptions = {
      from: `"HẢI PHÚC SHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[HAIPHUC SHOP] XÁC NHẬN ĐƠN HÀNG #${order._id.toString().slice(-6).toUpperCase()}`,
      html: `
        <div style="font-family: 'Helvetica', Arial, sans-serif; color: #000; max-width: 600px; margin: auto; border: 10px solid #000; padding: 20px;">
          <h1 style="text-align: center; font-size: 30px; letter-spacing: 5px; border-bottom: 2px solid #000; padding-bottom: 20px;">THANK YOU, ${fullName.toUpperCase()}!</h1>
          
          <p>Chào đại ca/chị đẹp, Shop đã nhận được khoản thanh toán cọc cho đơn hàng của mình.</p>
          
          <div style="background: #f4f4f4; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">TÓM TẮT ĐƠN HÀNG</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #000; color: #fff;">
                  <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                  <th style="padding: 10px;">Size/Màu</th>
                  <th style="padding: 10px;">SL</th>
                  <th style="padding: 10px;">Giá</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows}
              </tbody>
            </table>
          </div>

          <div style="text-align: right; line-height: 1.6;">
            <p>Tổng giá trị: <strong>${totalAmount.toLocaleString()}đ</strong></p>
            <p style="color: #ff0000; font-size: 18px;">Đã cọc: <strong>${depositAmount.toLocaleString()}đ</strong></p>
            <p style="border-top: 1px solid #000; padding-top: 10px;">Số tiền còn lại khi nhận hàng: <strong>${(totalAmount - depositAmount).toLocaleString()}đ</strong></p>
          </div>

          <div style="margin-top: 30px; border-left: 5px solid #000; padding-left: 15px;">
            <p><strong>DỰ KIẾN GIAO HÀNG:</strong> 7-10 ngày làm việc (với hàng ORDER).</p>
            <p><strong>MÃ VẬN ĐƠN:</strong> Sẽ được cập nhật ngay khi hàng về kho Việt Nam.</p>
          </div>

          <p style="text-align: center; margin-top: 40px; font-size: 10px; color: #888;">&copy; 2024 HAIPHUC SHOP | HÀNG ORDER UY TÍN</p>
        </div>
      `
    };

    await transporter.sendMail(customerMailOptions);
    console.log(`[Email] Đã gửi thông báo đơn hàng thành công cho ${fullName}.`);
  } catch (error) {
    console.error('[Email Error]', error);
  }
};
