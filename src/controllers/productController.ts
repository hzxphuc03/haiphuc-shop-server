import type { Request, Response } from 'express';
import Product from '../models/Product';

/**
 * Lấy danh sách sản phẩm (Mới nhất lên đầu)
 */
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Thêm sản phẩm mới (Hỗ trợ Upload ảnh)
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, priceVND } = req.body;

    if (!name || !priceVND) {
      res.status(400).json({ error: 'Tên và giá VND là bắt buộc' });
      return;
    }

    // Nếu có file ảnh được upload, gán URL vào mảng images
    const productData = { ...req.body };
    if (req.file) {
      productData.images = [req.file.path]; // Lấy URL từ Cloudinary
    }

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cập nhật sản phẩm
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { 
      new: true, 
      runValidators: true 
    });

    if (!updatedProduct) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      return;
    }

    res.status(200).json(updatedProduct);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Xóa sản phẩm
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      return;
    }

    res.status(200).json({ message: 'Đã xóa sản phẩm thành công' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
