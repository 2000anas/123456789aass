import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await authService.login(req.body.email, req.body.password);
    sendSuccess(res, data, 200, 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await authService.getMe(req.user!.id);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
