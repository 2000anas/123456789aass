import { z } from 'zod';
import { WEEK_DAYS, CURRENCIES } from '../config/env.js';

export const loginSchema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const transactionSchema = z.object({
  type: z.enum(['IN', 'OUT'], { required_error: 'نوع العملية مطلوب' }),
  amount: z.coerce.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
  currency: z.enum(CURRENCIES, { required_error: 'العملة مطلوبة' }),
  category: z.string().min(1, 'التصنيف مطلوب'),
  description: z.string().min(1, 'الوصف مطلوب'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional(),
});

const categoryInputSchema = z.object({
  name: z.string().optional(),
  nameAr: z.string().min(1, 'اسم التصنيف مطلوب'),
  type: z.enum(['IN', 'OUT']),
  isActive: z.boolean().optional(),
});

function normalizeCategoryInput<T extends { name?: string; nameAr?: string }>(data: T) {
  if (!data.nameAr) return data;
  return {
    ...data,
    name: (data.name?.trim() || data.nameAr.trim()),
    nameAr: data.nameAr.trim(),
  };
}

export const categorySchema = categoryInputSchema.transform(normalizeCategoryInput);

export const categoryUpdateSchema = categoryInputSchema.partial().transform((data) => normalizeCategoryInput(data));

export const employeeSchema = z.object({
  fullName: z.string().min(1, 'الاسم الكامل مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional(),
  phone: z.string().optional(),
  position: z.string().min(1, 'المسمى الوظيفي مطلوب'),
  monthlySalary: z.coerce.number().min(0, 'الراتب غير صالح'),
  salaryCurrency: z.enum(CURRENCIES).default('USD'),
  workingDays: z.array(z.enum(WEEK_DAYS)).min(1, 'أيام العمل مطلوبة'),
  dailyWorkingHours: z.coerce.number().min(1).max(24),
  expectedStartTime: z.string().regex(/^\d{2}:\d{2}$/, 'وقت البداية غير صالح'),
  expectedEndTime: z.string().regex(/^\d{2}:\d{2}$/, 'وقت النهاية غير صالح'),
  weeklyDayOff: z.enum(WEEK_DAYS),
  employmentStartDate: z.string().min(1, 'تاريخ التعيين مطلوب'),
  isActive: z.boolean().optional(),
});

export const attendanceUpdateSchema = z.object({
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  status: z.enum(['present', 'late', 'absent', 'incomplete']).optional(),
  lateMinutes: z.coerce.number().min(0).optional(),
  workedMinutes: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export const settingsSchema = z.object({
  companyName: z.string().optional(),
  companyNameAr: z.string().optional(),
  defaultCurrency: z.enum(CURRENCIES).optional(),
  displayCurrencies: z.array(z.enum(CURRENCIES)).optional(),
  timezone: z.string().optional(),
});
