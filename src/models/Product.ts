import mongoose, { Schema, type Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  priceVND: number;
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
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
  },
  { 
    timestamps: true,
    versionKey: false 
  }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
