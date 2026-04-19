import mongoose, { Schema, type Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  priceVND: number;
  category: 'Giày' | 'Quần' | 'Áo' | 'Phụ kiện' | 'Bộ đồ';
  sizes: string[];
  colors: string[];
  images: string[];
  stock: number;
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
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    images: { 
      type: [String], 
      validate: {
        validator: function(v: string[]) {
          return v && v.length >= 1 && v.length <= 6;
        },
        message: 'Sản phẩm phải có ít nhất 1 ảnh và tối đa 6 ảnh.'
      },
      required: true
    },
    stock: { type: Number, default: 0, min: 0 },
  },
  { 
    timestamps: true,
    versionKey: false 
  }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
