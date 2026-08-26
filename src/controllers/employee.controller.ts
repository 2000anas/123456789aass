import { NextFunction, Request, Response } from 'express';
import * as employeeService from '../services/employee.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await employeeService.listEmployees({
      search: req.query.search as string | undefined,
      active: req.query.active as string | undefined,
    });
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await employeeService.getEmployeeById(req.params.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await employeeService.createEmployee(req.body);
    sendSuccess(res, data, 201, 'تمت إضافة الموظف بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await employeeService.updateEmployee(req.params.id, req.body);
    sendSuccess(res, data, 200, 'تم تحديث بيانات الموظف بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function toggleActive(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await employeeService.setEmployeeActive(req.params.id, Boolean(req.body.isActive));
    sendSuccess(res, data, 200, 'تم تحديث حالة الموظف');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await employeeService.deleteEmployee(req.params.id);
    sendSuccess(res, null, 200, 'تم حذف الموظف بنجاح');
  } catch (error) {
    next(error);
  }
}
