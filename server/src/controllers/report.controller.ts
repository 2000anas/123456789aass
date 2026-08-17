import { NextFunction, Request, Response } from 'express';
import * as salaryService from '../services/salary.service.js';
import * as reportService from '../services/report.service.js';
import * as dashboardService from '../services/dashboard.service.js';
import { Settings } from '../models/Settings.js';
import { sendSuccess } from '../utils/apiResponse.js';
import type { Currency } from '../config/env.js';

export async function salaryReport(req: Request, res: Response, next: NextFunction) {
  try {
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const data = await salaryService.calculateMonthlySalary(req.params.employeeId, year, month);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function financialReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await reportService.financialSummary(
      req.query.startDate as string | undefined,
      req.query.endDate as string | undefined
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function expenseReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await reportService.expenseReport(
      req.query.startDate as string | undefined,
      req.query.endDate as string | undefined,
      req.query.currency as Currency | undefined
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function transactionReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await reportService.transactionReport(
      req.query.startDate as string | undefined,
      req.query.endDate as string | undefined,
      req.query.currency as Currency | undefined
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function dashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getAdminDashboard();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getSettings(_req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    Object.assign(settings, req.body);
    await settings.save();
    sendSuccess(res, settings, 200, 'تم حفظ الإعدادات');
  } catch (error) {
    next(error);
  }
}
