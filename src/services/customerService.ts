import mongoose from 'mongoose';
import User, { type IUser } from '../models/User.js';

export class CustomerService {
  /**
   * Lấy danh sách khách hàng với phân trang và bộ lọc
   */
  static async getAllCustomers(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const filter: mongoose.FilterQuery<IUser> = { 
      isDeleted: { $ne: true }, 
      role: 'user' 
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const [customers, totalItems] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    return {
      customers,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page
    };
  }

  /**
   * Lấy chi tiết khách hàng
   */
  static async getCustomerById(id: string) {
    const customer = await User.findOne({ _id: id, isDeleted: { $ne: true }, role: 'user' })
      .select('-password -refreshToken')
      .lean();
    
    if (!customer) {
      throw new Error('Không tìm thấy khách hàng');
    }
    
    return customer;
  }

  /**
   * Cập nhật trạng thái tài khoản
   */
  static async updateStatus(id: string, status: 'active' | 'inactive') {
    const customer = await User.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true }, role: 'user' },
      { status },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!customer) {
      throw new Error('Không tìm thấy khách hàng để cập nhật trạng thái');
    }

    return customer;
  }

  /**
   * Xóa mềm khách hàng
   */
  static async softDeleteCustomer(id: string) {
    const customer = await User.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true }, role: 'user' },
      { isDeleted: true },
      { new: true }
    );

    if (!customer) {
      throw new Error('Không tìm thấy khách hàng để xóa');
    }

    return { message: 'Đã xóa khách hàng thành công' };
  }
}
