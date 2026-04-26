import type { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import Order, { calculateOrderAmount } from '../models/Order.js';
import { sendOrderEmail, sendAdminOrderNotification, sendOrderReceivedEmail } from '../utils/email.js';
import payos from '../utils/payos.js';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { user, items, fullName, phoneNumber, email, address, paymentMethod, depositRate, orderCode } = req.body;

    if (!user || !items || items.length === 0 || !fullName || !phoneNumber || !email || !address) {
      return res.status(400).json({ message: 'Thông tin đơn hàng không đầy đủ!' });
    }

    // 1. Map items to correct format
    const orderItems = items.map((item: any) => ({
      product: item._id,
      quantity: item.quantity,
      price: item.priceVND,
      type: item.type,
      size: item.selectedSize || item.size,
      color: item.selectedColor || item.color,
      imageUrl: item.displayImage || (item.images && item.images[0]?.url)
    }));

    // 2. Calculate amounts based on selected rate
    const shippingFee = 30000;
    const currentRate = (depositRate !== undefined && depositRate !== null) ? Number(depositRate) : 0.7;
    
    const { totalAmount: subTotal } = calculateOrderAmount(orderItems, currentRate);
    const finalTotal = subTotal + shippingFee;
    
    // Tiền cọc tính trên tổng tiền cuối cùng (bao gồm ship)
    const finalDeposit = Math.round(finalTotal * currentRate);

    // 3. Create Order
    const newOrder = new Order({
      userId: req.user?.id,
      user,
      fullName,
      phoneNumber,
      email,
      address,
      items: orderItems,
      totalAmount: finalTotal,
      depositAmount: paymentMethod === 'COD' ? 0 : finalDeposit,
      depositRate: paymentMethod === 'COD' ? 0 : (depositRate || 0.7),
      paymentMethod: paymentMethod || 'QR_CODE',
      paymentStatus: 'PENDING',
      status: 'PENDING_DEPOSIT',
      orderCode: orderCode || undefined // Dùng mã từ FE gửi lên nếu có
    });

    await newOrder.save();

    // 4. Nếu là thanh toán QR (PayOS), tạo link thanh toán
    let checkoutUrl = null;
    if (paymentMethod === 'QR_CODE') {
        try {
            // PayOS yêu cầu orderCode là INT
            // Ta dùng 6 số cuối của timestamp + số ngẫu nhiên
            const payosOrderCode = Number(Date.now().toString().slice(-9));
            
            // Lưu lại mã này vào paymentLinkId để đối soát webhook
            newOrder.paymentLinkId = payosOrderCode.toString();
            await newOrder.save();

            const paymentData = {
                orderCode: payosOrderCode,
                amount: newOrder.depositAmount,
                description: `HP ${newOrder.orderCode}`,
                cancelUrl: `${process.env.FRONTEND_URL || 'https://haiphuc-shop.vercel.app'}/checkout`,
                returnUrl: `${process.env.FRONTEND_URL || 'https://haiphuc-shop.vercel.app'}/order-success/${newOrder._id}`,
                items: orderItems.map((item: any) => ({
                    name: 'Gank đồ Hải Phúc',
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            const paymentLink = await payos.paymentRequests.create(paymentData);
            checkoutUrl = paymentLink.checkoutUrl;
        } catch (payosError: any) {
            console.error('PayOS Create Link Error:', payosError);
            // Vẫn cho tạo đơn nhưng báo lỗi link
        }
    }

    // 🔔 GỬI THÔNG BÁO NGAY LẬP TỨC
    const populatedOrder = await newOrder.populate('items.product');

    // Báo cho Admin
    sendAdminOrderNotification(populatedOrder);

    // Báo cho Khách (Xác nhận đã nhận đơn)
    sendOrderReceivedEmail(populatedOrder);

    res.status(201).json({
      message: 'Đặt đơn thành công!',
      order: newOrder,
      checkoutUrl // Trả về link PayOS cho FE
    });
  } catch (error: any) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Bạn cần đăng nhập để xem đơn hàng!' });
    }



    const { page = 1, limit = 10, showAll, claimAll } = req.query;
    const currentPage = Number(page);
    const itemsPerPage = Number(limit);
    const skip = (currentPage - 1) * itemsPerPage;

    // AUTO MIGRATION: Gán userId cho đơn hàng cũ (bước 1) & Populate orderCode (bước 2)
    const unlinkedOrders = await Order.find({ 
      $or: [
        { userId: { $exists: false } },
        { orderCode: { $exists: false } }
      ]
    });

    if (unlinkedOrders.length > 0) {

      for (const order of unlinkedOrders) {
        if (!order.userId) order.userId = req.user.id as any;
        if (!order.orderCode) order.orderCode = order._id.toString().slice(-8).toUpperCase();
        await order.save();
      }

    }

    // 2. Xác định Filter
    let filter: any = { userId: req.user.id };
    if (req.user.role === 'admin' && showAll === 'true') {
        filter = {};
    }

    const [orders, totalItems] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(itemsPerPage)
        .populate('items.product'),
      Order.countDocuments(filter)
    ]);





    res.json({
      data: orders,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
      currentPage
    });
  } catch (error: any) {
    console.error('ERROR IN getMyOrders:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const filter: any = {};

    // Lọc theo trạng thái đơn hàng
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    // Tìm kiếm theo mã đơn, tên hoặc SĐT
    if (search && typeof search === 'string') {
      filter.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const currentPage = Number(page);
    const itemsPerPage = Number(limit);
    const skip = (currentPage - 1) * itemsPerPage;

    const [orders, totalItems] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(itemsPerPage)
        .populate('items.product'),
      Order.countDocuments(filter)
    ]);

    res.json({
      data: orders,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
      currentPage
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin update status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updateData: any = { status };

    // Đồng bộ paymentStatus dựa theo status mới
    if (status === 'DEPOSITED' || status === 'CONFIRMED' || status === 'ARRIVED_VN' || status === 'SHIPPING') {
      updateData.paymentStatus = 'DEPOSITED';
    } else if (status === 'SUCCESS') {
      updateData.paymentStatus = 'COMPLETED';
    } else if (status === 'PENDING_DEPOSIT') {
      updateData.paymentStatus = 'PENDING';
    }

    const order = await Order.findByIdAndUpdate(id, updateData, { new: true }).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Nếu xác nhận đã cọc, gửi mail thông báo cho khách và admin
    if (status === 'DEPOSITED') {
      await sendOrderEmail(order);
    }

    res.json({ message: 'Trạng thái đơn hàng đã được cập nhật!', order });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin get single order
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Admin delete order
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    res.json({ message: 'Đơn hàng đã được xóa vĩnh viễn!' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
