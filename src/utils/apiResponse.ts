import { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string) {
  return res.status(statusCode).json({
    success: true,
    ...(message ? { message } : {}),
    data,
  });
}

export function sendMessage(res: Response, message: string, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
  });
}
