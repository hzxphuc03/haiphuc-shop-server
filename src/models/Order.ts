import mongoose, { Schema, type Document } from 'mongoose';
import { sendOrderEmail } from '../utils/email.js';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  type: 'READY' | 'ORDER';
  size?: string;
  color?: string;
  imageUrl?: string;
}

export interface IOrder extends Document {
  userId?: mongoose.Types.ObjectId;
  user: string; // Nickname/Reference
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  items: IOrderItem[];
  totalAmount: number;
  depositAmount: number;
  depositRate: number;
  status: 'PENDING_DEPOSIT' | 'DEPOSITED' | 'CONFIRMED' | 'ARRIVED_VN' | 'SHIPPING' | 'SUCCESS' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'DEPOSITED' | 'COMPLETED';
  paymentMethod: 'QR_CODE' | 'COD';
  orderCode: string;
  paymentLinkId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    user: { type: String, required: true },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        type: { type: String, enum: ['READY', 'ORDER'], required: true },
        size: { type: String },
        color: { type: String },
        imageUrl: { type: String }
      }
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0 },
    depositRate: { type: Number, default: 0.7 },
    status: {
      type: String,
      enum: ['PENDING_DEPOSIT', 'DEPOSITED', 'CONFIRMED', 'ARRIVED_VN', 'SHIPPING', 'SUCCESS', 'CANCELLED'],
      default: 'PENDING_DEPOSIT'
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'DEPOSITED', 'COMPLETED'],
      default: 'PENDING'
    },
    paymentMethod: {
      type: String,
      enum: ['QR_CODE', 'COD'],
      default: 'QR_CODE'
    },
    orderCode: { type: String, unique: true, index: true },
    paymentLinkId: { type: String },
    paidAt: { type: Date }
  },
  {
    timestamps: true,
    versionKey: false
  }
);
// TỰ ĐỘNG TẠO MÃ ĐƠN HÀNG NGẮN TỪ _ID TRƯỚC KHI SAVE
OrderSchema.pre('save', async function(this: IOrder) {
  if (!this.orderCode) {
    this.orderCode = this._id.toString().slice(-8).toUpperCase();
  }
});

// TỰ ĐỘNG GỬI MAIL KHI TRẠNG THÁI CHUYỂN SANG 'DEPOSITED'
OrderSchema.post('save', async function(doc) {
  // @ts-ignore
  if (doc.paymentStatus === 'DEPOSITED') {

     // Populate sản phẩm trước khi gửi mail để có tên và ảnh
     const populatedOrder = await doc.populate('items.product');
     await sendOrderEmail(populatedOrder);
  }
});

/**
 * Hàm tính toán số tiền cọc (depositAmount)
 * @param items Danh sách sản phẩm trong giỏ
 * @param orderDepositRate Tỷ lệ cọc cho hàng ORDER (mặc định 0.7 - 70% hoặc 1.0 - 100%)
 * @returns { totalAmount, depositAmount }
 */
export const calculateOrderAmount = (
  items: { price: number; quantity: number; type: 'READY' | 'ORDER' }[],
  orderDepositRate: number = 0.7
) => {
  let totalAmount = 0;
  let depositAmount = 0;

  items.forEach(item => {
    const itemTotal = item.price * item.quantity;
    totalAmount += itemTotal;
    // Áp dụng tỷ lệ cọc chung cho toàn bộ đơn hàng dựa theo lựa chọn của khách
    depositAmount += itemTotal * orderDepositRate;
  });

  return { totalAmount, depositAmount: Math.round(depositAmount) };
};

export default mongoose.model<IOrder>('Order', OrderSchema);
