import mongoose, { Schema, type Document } from 'mongoose';

export interface IProductImage {
  url: string;
  color: string; // 'All' hoặc tên màu cụ thể (Black, White...)
}

export interface IProduct extends Document {
  name: string;
  description: string;
  priceVND: number;
  category: 'Giày' | 'Quần' | 'Áo' | 'Phụ kiện' | 'Bộ đồ';
  sizes: string[];
  colors: string[];
  images: IProductImage[];
  stock: number;
  type: 'READY' | 'ORDER';
  isSale: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    priceVND: { type: Number, required: true, min: 0 },
    category: { 
      type: String, 
      required: true, 
      enum: ['Giày', 'Quần', 'Áo', 'Phụ kiện', 'Bộ đồ'],
      default: 'Áo'
    },
    sizes: { 
      type: [String], 
      default: []
    },
    colors: { 
      type: [String], 
      default: []
    },
    images: [
      {
        url: { type: String, required: true },
        color: { type: String, default: 'All' }
      }
    ],
    stock: { type: Number, default: 0, min: 0 },
    type: { 
      type: String, 
      enum: ['READY', 'ORDER'], 
      default: 'READY',
      required: true
    },
    isSale: { type: Boolean, default: false }
  },
  { 
    timestamps: true,
    versionKey: false 
  }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
