import { z } from 'zod';

/**
 * Schema cho Đăng nhập
 */
export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(50, 'Tên đăng nhập không quá 50 ký tự'),
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

/**
 * Schema cho Đăng ký (Nếu có mở rộng trong tương lai)
 */
export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(50, 'Tên đăng nhập không quá 50 ký tự'),
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  fullName: z.string().min(2, 'Họ tên quá ngắn'),
  avatar: z.string().optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
