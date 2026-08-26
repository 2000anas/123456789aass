import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { User, UserRole } from '../models/User.js';
import type { Types } from 'mongoose';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JwtPayload {
  id: string;
  role: UserRole;
}

export function signToken(userId: Types.ObjectId | string, role: UserRole): string {
  return jwt.sign({ id: String(userId), role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('يجب تسجيل الدخول أولاً', 401);
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new AppError('الحساب غير موجود أو غير نشط', 401);
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId ? String(user.employeeId) : undefined,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError('جلسة غير صالحة، يرجى تسجيل الدخول مجدداً', 401));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('ليس لديك صلاحية للوصول إلى هذا المورد', 403));
    }
    next();
  };
}
