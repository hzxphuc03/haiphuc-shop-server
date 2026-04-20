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
    const { fullName, user, phoneNumber, address, items, totalAmount, depositAmount } = order;
    const remainingAmount = totalAmount - depositAmount;
    
    const adminMailOptions = {
      from: `"HỆ THỐNG HAIPHUC" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `🚨 ĐƠN HÀNG MỚI CHỜ CỌC: ${fullName.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 30px; border: 10px solid #000; max-width: 600px; margin: auto;">
          <h2 style="color: #ff0000; text-align: center; font-size: 24px;">CÓ ĐƠN HÀNG MỚI ĐANG CHỜ CỌC!</h2>
          <hr style="border: 2px solid #000;">
          <div style="background: #f9f9f9; padding: 15px; margin-bottom: 20px;">
             <p><strong>KHÁCH HÀNG:</strong> ${fullName}</p>
             <p><strong>NICKNAME:</strong> ${user}</p>
             <p><strong>SỐ ĐIỆN THOẠI:</strong> ${phoneNumber}</p>
             <p><strong>ĐỊA CHỈ:</strong> ${address}</p>
          </div>
          <hr style="border: 1px solid #eee;">
          <h3>CHI TIẾT GIỎ HÀNG:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${items.map((i: any) => `
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 10px;">${i.product?.name || 'Sản phẩm'}</td>
                <td style="padding: 10px; text-align: center;">${i.size}/${i.color}</td>
                <td style="padding: 10px; text-align: right;">x${i.quantity}</td>
              </tr>
            `).join('')}
          </table>

          <div style="margin-top: 25px; padding: 15px; background: #000; color: #fff; text-align: right;">
             <p style="margin: 5px 0;">TỔNG CỘNG: <strong>${totalAmount.toLocaleString()}đ</strong></p>
             <p style="margin: 5px 0; color: #00ff00;">KHÁCH CẦN CỌC: <strong>${depositAmount.toLocaleString()}đ</strong></p>
             <p style="margin: 5px 0; color: #ff4d4d;">CÒN THIẾU (COD): <strong>${remainingAmount.toLocaleString()}đ</strong></p>
          </div>

          <div style="margin-top: 30px; text-align: center; border: 2px solid #000; padding: 15px;">
            <a href="http://localhost:4200/h4iphuc-secret-admin/orders" style="color: #000; text-decoration: none; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;">XÁC NHẬN ĐÃ NHẬN TIỀN CỌC</a>
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
    const { fullName, email, items, totalAmount, depositAmount, paymentMethod } = order;
    
    // Tạo danh sách món đồ
    const itemRows = items.map((i: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">${i.product?.name || 'Sản phẩm'}</td>
        <td style="padding: 10px; text-align: center;">${i.size}/${i.color}</td>
        <td style="padding: 10px; text-align: right;">x${i.quantity}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"HẢI PHÚC SHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔥 ĐẶT ĐƠN THÀNH CÔNG: #${order._id.toString().slice(-6).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 10px solid #000; padding: 20px; color: #000;">
          <h2 style="text-align: center; font-size: 24px; text-transform: uppercase;">XÁC NHẬN ĐẶT ĐƠN</h2>
          <p>Chào <strong>${fullName}</strong>, shop đã nhận được yêu cầu "lên đồ" của đại ca.</p>
          
          <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
            <p><strong>Mã đơn:</strong> #${order._id.toString().toUpperCase()}</p>
            <p><strong>Trình trạng:</strong> <span style="color: #ff0000; font-weight: bold;">ĐANG CHỜ THANH TOÁN / XÁC NHẬN</span></p>
            <p><strong>Phương thức:</strong> ${paymentMethod}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
             <thead>
                <tr style="background: #eee;">
                   <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                   <th style="padding: 10px;">Size</th>
                   <th style="padding: 10px; text-align: right;">SL</th>
                </tr>
             </thead>
             <tbody>
                ${itemRows}
             </tbody>
          </table>

          <div style="text-align: right; margin-top: 20px; border-top: 2px solid #000; padding-top: 10px;">
             <p style="font-size: 18px;">Tổng giá trị: <strong>${totalAmount.toLocaleString()}đ</strong></p>
             <p style="font-size: 20px; color: #ff0000;">Cần cọc/Thanh toán: <strong>${depositAmount.toLocaleString()}đ</strong></p>
          </div>

          <div style="margin-top: 30px; padding: 15px; border: 2px dashed #000; text-align: center;">
             <p>Nếu đại ca dùng <strong>QR CODE</strong>, vui lòng kiểm tra lại hình ảnh QR tại web hoặc Bank theo STK: <strong>0972221123 (MB BANK)</strong>.</p>
             <p>Nội dung: <strong>HAIPHUC ${order._id.toString().slice(-6).toUpperCase()}</strong></p>
          </div>

          <p style="font-size: 12px; margin-top: 30px; opacity: 0.5; text-align: center;">Sau khi nhận được tiền, Shop sẽ gank đơn ngay lập tức!</p>
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
    const { fullName, email, items, totalAmount, depositAmount } = order;

    const itemRows = items.map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">${item.product?.name || 'Sản phẩm'}</td>
        <td style="padding: 10px; text-align: center;">${item.size || 'N/A'} - ${item.color || 'N/A'}</td>
        <td style="padding: 10px; text-align: center;">x${item.quantity}</td>
        <td style="padding: 10px; text-align: right;">${item.price.toLocaleString()}đ</td>
      </tr>
    `).join('');

    const customerMailOptions = {
      from: `"HẢI PHÚC SHOP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ THANH TOÁN THÀNH CÔNG: #${order._id.toString().slice(-6).toUpperCase()}`,
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
