import type { Request, Response } from 'express';
import Product from '../models/Product.js';

/**
 * Lấy danh sách sản phẩm (Hỗ trợ Search, Phân trang, lọc Category)
 */
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, type, isSale, search, page = 1, limit = 10 } = req.query;
    
    // 1. Xây dựng bộ lọc (Filter)
    const filter: any = {};
    
    // Lọc theo Category
    if (category && typeof category === 'string' && category !== 'Tất cả') {
      filter.category = category;
    }

    // Lọc theo Type (READY / ORDER)
    if (type && typeof type === 'string' && type !== 'Tất cả') {
      filter.type = type;
    }

    // Lọc theo isSale
    if (isSale === 'true') {
      filter.isSale = true;
    }
    
    // Lọc theo Search (Regex name hoặc description)
    if (search && typeof search === 'string') {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Phân trang logic
    const currentPage = Number(page);
    const itemsPerPage = Number(limit);
    const skip = (currentPage - 1) * itemsPerPage;

    // 3. Thực thi query song song
    const [products, totalItems] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(itemsPerPage),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    res.status(200).json({
      data: products,
      totalItems,
      totalPages,
      currentPage
    });
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
 * Thêm sản phẩm mới (Hỗ trợ Upload ảnh kèm màu sắc)
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, priceVND, images, imageColors, sizes, colors } = req.body;

    if (!name || !priceVND) {
      res.status(400).json({ error: 'Tên và giá VND là bắt buộc' });
      return;
    }

    // Parse imageColors (hỗ trợ cả chuỗi comma-separated hoặc mảng)
    const colorsList = Array.isArray(imageColors) ? imageColors : (imageColors ? imageColors.split(',') : []);

    let finalImages: any[] = [];
    
    // 1. Xử lý ảnh mới upload từ Files (Multer Cloudinary)
    if (req.files && Array.isArray(req.files)) {
      (req.files as any[]).forEach((file, index) => {
        finalImages.push({
          url: file.path, 
          color: colorsList[index] || 'All'
        });
      });
    }

    // 2. Xử lý ảnh truyền dưới dạng URL (NẾU trong body có images là string/array string)
    // Lưu ý: Multer có thể để lại field name trong body nếu không được xử lý hết
    if (images && images !== 'undefined') {
      const existingUrls = Array.isArray(images) ? images : [images];
      const offset = finalImages.length;
      existingUrls.forEach((url, index) => {
        // Chỉ thêm nếu là URL hợp lệ (tránh lấy nhầm metadata file)
        if (typeof url === 'string' && url.startsWith('http')) {
          finalImages.push({
            url,
            color: colorsList[offset + index] || 'All'
          });
        }
      });
    }

    if (finalImages.length === 0) {
      res.status(400).json({ error: 'Sản phẩm phải có ít nhất một hình ảnh.' });
      return;
    }

    // Đảm bảo sizes và colors là mảng
    const parsedSizes = Array.isArray(sizes) ? sizes : (sizes ? sizes.split(',').map((s: string) => s.trim()) : []);
    const parsedColors = Array.isArray(colors) ? colors : (colors ? colors.split(',').map((c: string) => c.trim()) : []);

    const newProduct = new Product({
      name,
      description: req.body.description || '',
      priceVND: Number(priceVND),
      category: req.body.category || 'Áo',
      type: req.body.type || 'READY',
      stock: Number(req.body.stock) || 0,
      images: finalImages,
      sizes: parsedSizes,
      colors: parsedColors
    });

    const savedProduct = await newProduct.save();
    console.log('✅ Product saved successfully:', savedProduct._id);
    res.status(201).json(savedProduct);
  } catch (error: any) {
    console.error('❌ Create Product Error:', error);
    res.status(500).json({ 
      error: 'Lỗi máy chủ khi tạo sản phẩm', 
      details: error.message 
    });
  }
};

/**
 * Cập nhật sản phẩm
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, priceVND, images, imageColors, sizes, colors } = req.body;
    

    const colorsList = Array.isArray(imageColors) ? imageColors : (imageColors ? imageColors.split(',') : []);
    let finalImages: any[] = [];

    // 1. Ảnh upload mới (Multer Cloudinary)
    if (req.files && Array.isArray(req.files)) {
      (req.files as any[]).forEach((file, index) => {
        finalImages.push({
          url: file.path,
          color: colorsList[index] || 'All'
        });
      });
    }

    // 2. Ảnh cũ giữ lại hoặc URL truyền lên
    if (images) {
      const existingImages = Array.isArray(images) ? images : [images];
      const offset = finalImages.length;
      existingImages.forEach((imgData: any, index: number) => {
        if (typeof imgData === 'string') {
          // Nếu là string, đây là URL cũ được gửi lại
          if (imgData.startsWith('http')) {
            finalImages.push({
              url: imgData,
              color: colorsList[offset + index] || 'All'
            });
          }
        } else if (imgData && typeof imgData === 'object' && imgData.url) {
          // Nếu là object {url, color}
          finalImages.push(imgData);
        }
      });
    }

    const updateData: any = {
      ...req.body,
      images: finalImages
    };

    // Đảm bảo kiểu dữ liệu cho các trường mảng và số
    if (sizes) {
      updateData.sizes = Array.isArray(sizes) ? sizes : sizes.split(',').map((s: string) => s.trim());
    }
    if (colors) {
      updateData.colors = Array.isArray(colors) ? colors : colors.split(',').map((c: string) => c.trim());
    }
    if (priceVND) {
      updateData.priceVND = Number(priceVND);
    }
    if (req.body.stock) {
      updateData.stock = Number(req.body.stock);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true 
    });

    if (!updatedProduct) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      return;
    }

    console.log('✅ Product updated successfully:', id);
    res.status(200).json(updatedProduct);
  } catch (error: any) {
    console.error('❌ Update Product Error:', error);
    res.status(500).json({ 
      error: 'Lỗi máy chủ khi cập nhật sản phẩm', 
      details: error.message 
    });
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
