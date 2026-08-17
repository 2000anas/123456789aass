import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { signToken } from '../middleware/auth.js';

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !user.isActive) {
    throw new AppError('بيانات الدخول غير صحيحة', 401);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError('بيانات الدخول غير صحيحة', 401);
  }

  const token = signToken(user._id, user.role);

  return {
    token,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId ? String(user.employeeId) : undefined,
    },
  };
}

export async function getMe(userId: string) {
  const user = await User.findById(userId).populate('employeeId');
  if (!user) throw new AppError('المستخدم غير موجود', 404);
  return user;
}
