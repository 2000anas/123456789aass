import { NextFunction, Request, Response } from 'express';
import * as attendanceService from '../services/attendance.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) throw new AppError('حساب الموظف غير مرتبط', 400);
    const data = await attendanceService.checkIn(employeeId);
    sendSuccess(res, data, 200, 'تم تسجيل الحضور بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function checkOut(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) throw new AppError('حساب الموظف غير مرتبط', 400);
    const data = await attendanceService.checkOut(employeeId);
    sendSuccess(res, data, 200, 'تم تسجيل الانصراف بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function todayMine(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) throw new AppError('حساب الموظف غير مرتبط', 400);
    const data = await attendanceService.getTodayForEmployee(employeeId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function myHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) throw new AppError('حساب الموظف غير مرتبط', 400);
    const data = await attendanceService.getEmployeeAttendanceHistory(employeeId, 60);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await attendanceService.listAttendance({
      employeeId: req.query.employeeId as string | undefined,
      date: req.query.date as string | undefined,
      month: req.query.month as string | undefined,
      year: req.query.year as string | undefined,
      status: req.query.status as string | undefined,
      page: Number(req.query.page),
      limit: Number(req.query.limit),
    });
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function todayOverview(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await attendanceService.getTodayAttendanceOverview();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await attendanceService.updateAttendance(req.params.id, req.body);
    sendSuccess(res, data, 200, 'تم تحديث سجل الحضور');
  } catch (error) {
    next(error);
  }
}
