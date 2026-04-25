import type { Request, Response } from 'express';
import Order, { calculateOrderAmount } from '../models/Order.js';
import { sendOrderEmail, sendAdminOrderNotification, sendOrderReceivedEmail } from '../utils/email.js';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { user, items, fullName, phoneNumber, email, address, paymentMethod, depositRate } = req.body;

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
    const { totalAmount, depositAmount } = calculateOrderAmount(orderItems, depositRate || 0.7);

    // 3. Create Order
    const newOrder = new Order({
      user,
      fullName,
      phoneNumber,
      email,
      address,
      items: orderItems,
      totalAmount,
      depositAmount: paymentMethod === 'COD' ? 0 : depositAmount,
      depositRate: paymentMethod === 'COD' ? 0 : (depositRate || 0.7),
      paymentMethod: paymentMethod || 'QR_CODE',
      paymentStatus: 'PENDING'
    });

    await newOrder.save();

    // 🔔 GỬI THÔNG BÁO NGAY LẬP TỨC
    const populatedOrder = await newOrder.populate('items.product');
    
    // Báo cho Admin
    sendAdminOrderNotification(populatedOrder); 
    
    // Báo cho Khách (Xác nhận đã nhận đơn)
    sendOrderReceivedEmail(populatedOrder); 

    res.status(201).json({
      message: 'Đặt đơn thành công! Vui lòng chờ đại ca xác nhận tiền cọc.',
      order: newOrder
    });
  } catch (error: any) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const { user, page = 1, limit = 10 } = req.query;
        if (!user) return res.status(400).json({ message: 'User identifier is required' });
        
        const currentPage = Number(page);
        const itemsPerPage = Number(limit);
        const skip = (currentPage - 1) * itemsPerPage;

        const [orders, totalItems] = await Promise.all([
          Order.find({ user: user as string })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(itemsPerPage)
            .populate('items.product'),
          Order.countDocuments({ user: user as string })
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

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        
        const filter: any = {};
        
        // Lọc theo trạng thái đơn hàng
        if (status && status !== 'ALL') {
          filter.paymentStatus = status;
        }

        // Tìm kiếm theo tên hoặc SĐT
        if (search && typeof search === 'string') {
          filter.$or = [
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
        const { paymentStatus } = req.body;
        
        const order = await Order.findByIdAndUpdate(id, { paymentStatus }, { new: true }).populate('items.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        // Nếu xác nhận đã cọc, gửi mail thông báo cho khách và admin
        if (paymentStatus === 'DEPOSITED') {
            await sendOrderEmail(order);
        }
        
        res.json({ message: 'Trạng thái đơn hàng đã được cập nhật!', order });
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
