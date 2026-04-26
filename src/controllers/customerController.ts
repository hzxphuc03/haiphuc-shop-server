import type { Request, Response } from 'express';
import { CustomerService } from '../services/customerService.js';

export class CustomerController {
  /**
   * GET /api/admin/customers
   */
  static async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const result = await CustomerService.getAllCustomers({ page, limit, search, status });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/admin/customers/:id
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const customer = await CustomerService.getCustomerById(id as string);
      res.status(200).json(customer);
    } catch (error: any) {
      const status = error.message === 'Không tìm thấy khách hàng' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/admin/customers/:id/status
   */
  static async updateStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
      }

      const { id } = req.params;
      const customer = await CustomerService.updateStatus(id as string, status);
      res.status(200).json(customer);
    } catch (error: any) {
      const status = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/admin/customers/:id
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await CustomerService.softDeleteCustomer(id as string);
      res.status(200).json(result);
    } catch (error: any) {
      const status = error.message.includes('Không tìm thấy') ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  }
}
