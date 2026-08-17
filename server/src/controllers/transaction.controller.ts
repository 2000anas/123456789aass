import { NextFunction, Request, Response } from 'express';
import * as transactionService from '../services/transaction.service.js';
import { sendMessage, sendSuccess } from '../utils/apiResponse.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await transactionService.listTransactions({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      type: req.query.type as string | undefined,
      category: req.query.category as string | undefined,
      currency: req.query.currency as string | undefined,
      search: req.query.search as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      sort: (req.query.sort as 'asc' | 'desc') || 'desc',
      includeRunningBalance: req.query.includeRunningBalance === 'true',
    });
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function balances(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await transactionService.getBalances();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await transactionService.createTransaction(req.body, req.user!.id);
    sendSuccess(res, data, 201, 'تمت إضافة العملية بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await transactionService.updateTransaction(req.params.id, req.body);
    sendSuccess(res, data, 200, 'تم تحديث العملية بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await transactionService.deleteTransaction(req.params.id);
    sendMessage(res, 'تم حذف العملية بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await transactionService.listCategories(
      req.query.type as string | undefined,
      req.query.includeInactive === 'true'
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await transactionService.createCategory(req.body);
    sendSuccess(res, data, 201, 'تم إنشاء التصنيف بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await transactionService.updateCategory(req.params.id, req.body);
    sendSuccess(res, data, 200, 'تم تحديث التصنيف بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function removeCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await transactionService.deleteCategory(req.params.id);
    const message = data.deleted
      ? 'تم حذف التصنيف بنجاح'
      : 'التصنيف مستخدم في معاملات سابقة، تم تعطيله بدلاً من الحذف';
    sendSuccess(res, data, 200, message);
  } catch (error) {
    next(error);
  }
}
