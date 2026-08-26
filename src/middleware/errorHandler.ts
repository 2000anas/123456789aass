import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('المسار غير موجود', 404));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = 'حدث خطأ في الخادم';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
    statusCode = 409;
    message = 'البيانات موجودة مسبقاً';
  } else if (err instanceof Error) {
    message = env.isProd ? message : err.message;
  }

  if (!env.isProd && err instanceof Error && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
