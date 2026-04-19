import type { Request, Response } from 'express';
import Product from '../models/Product.js';

/**
 * Lấy danh sách sản phẩm (Hỗ trợ lọc theo Category)
 */
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    
    // Đảm bảo category là một chuỗi trước khi lọc
    const filter = typeof category === 'string' ? { category } : {};
    
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Lấy chi tiết một sản phẩm theo ID
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      return;
    }
    res.status(200).json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Thêm sản phẩm mới (Hỗ trợ Upload ảnh)
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, priceVND, images } = req.body;

    if (!name || !priceVND) {
      res.status(400).json({ error: 'Tên và giá VND là bắt buộc' });
      return;
    }

    // Xử lý danh sách ảnh: Ưu tiên mảng images từ body, thêm ảnh từ files nếu có
    let finalImages: string[] = Array.isArray(images) ? [...images] : (images ? [images] : []);
    
    // Nếu có nhiều file được upload
    if (req.files && Array.isArray(req.files)) {
      const uploadedUrls = (req.files as any[]).map(f => f.path);
      finalImages = [...uploadedUrls, ...finalImages]; // Đưa ảnh mới lên đầu
    }

    const newProduct = new Product({
      ...req.body,
      images: finalImages
    });

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
    const { images } = req.body;
    const updateData = { ...req.body };

    // Xử lý cập nhật danh sách ảnh
    let finalImages: string[] = Array.isArray(images) ? [...images] : (images ? [images] : []);
    
    if (req.files && Array.isArray(req.files)) {
      const uploadedUrls = (req.files as any[]).map(f => f.path);
      finalImages = [...uploadedUrls, ...finalImages];
    }

    if (finalImages.length > 0) {
      updateData.images = finalImages;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { 
      new: true, // Trả về document sau khi đã được update
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
