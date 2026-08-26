import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Attendance } from '../models/Attendance.js';
import { AppError, assertFound } from '../utils/AppError.js';
import { parseLocalDate } from '../utils/timezone.js';
import type { Currency, WeekDay } from '../config/env.js';

export interface EmployeeInput {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  position: string;
  monthlySalary: number;
  salaryCurrency: Currency;
  workingDays: WeekDay[];
  dailyWorkingHours: number;
  expectedStartTime: string;
  expectedEndTime: string;
  weeklyDayOff: WeekDay;
  employmentStartDate: string;
  isActive?: boolean;
}

export async function listEmployees(query: { search?: string; active?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.active === 'true') filter.isActive = true;
  if (query.active === 'false') filter.isActive = false;
  if (query.search) {
    filter.$or = [
      { fullName: { $regex: query.search, $options: 'i' } },
      { position: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
    ];
  }

  return Employee.find(filter).populate('userId', 'email role isActive').sort({ createdAt: -1 });
}

export async function getEmployeeById(id: string) {
  const employee = await Employee.findById(id).populate('userId', 'email role isActive');
  assertFound(employee, 'الموظف غير موجود');
  return employee;
}

export async function createEmployee(input: EmployeeInput) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw new AppError('البريد الإلكتروني مستخدم مسبقاً', 409);
  if (!input.password) throw new AppError('كلمة المرور مطلوبة');

  const hashed = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    name: input.fullName,
    email: input.email.toLowerCase(),
    password: hashed,
    role: 'employee',
    isActive: input.isActive !== false,
  });

  try {
    const employee = await Employee.create({
      userId: user._id,
      fullName: input.fullName,
      phone: input.phone,
      position: input.position,
      monthlySalary: input.monthlySalary,
      salaryCurrency: input.salaryCurrency,
      workingDays: input.workingDays,
      dailyWorkingHours: input.dailyWorkingHours,
      expectedStartTime: input.expectedStartTime,
      expectedEndTime: input.expectedEndTime,
      weeklyDayOff: input.weeklyDayOff,
      employmentStartDate: parseLocalDate(input.employmentStartDate).toDate(),
      isActive: input.isActive !== false,
    });

    user.employeeId = employee._id;
    await user.save();

    return Employee.findById(employee._id).populate('userId', 'email role isActive');
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
}

export async function updateEmployee(id: string, input: EmployeeInput) {
  const employee = await Employee.findById(id);
  assertFound(employee, 'الموظف غير موجود');

  const user = await User.findById(employee.userId);
  assertFound(user, 'حساب المستخدم غير موجود');

  if (input.email.toLowerCase() !== user.email) {
    const emailTaken = await User.findOne({
      email: input.email.toLowerCase(),
      _id: { $ne: user._id },
    });
    if (emailTaken) throw new AppError('البريد الإلكتروني مستخدم مسبقاً', 409);
    user.email = input.email.toLowerCase();
  }

  user.name = input.fullName;
  if (typeof input.isActive === 'boolean') {
    user.isActive = input.isActive;
    employee.isActive = input.isActive;
  }
  if (input.password) {
    user.password = await bcrypt.hash(input.password, 10);
  }
  await user.save();

  employee.fullName = input.fullName;
  employee.phone = input.phone;
  employee.position = input.position;
  employee.monthlySalary = input.monthlySalary;
  employee.salaryCurrency = input.salaryCurrency;
  employee.workingDays = input.workingDays;
  employee.dailyWorkingHours = input.dailyWorkingHours;
  employee.expectedStartTime = input.expectedStartTime;
  employee.expectedEndTime = input.expectedEndTime;
  employee.weeklyDayOff = input.weeklyDayOff;
  employee.employmentStartDate = parseLocalDate(input.employmentStartDate).toDate();
  await employee.save();

  return Employee.findById(id).populate('userId', 'email role isActive');
}

export async function setEmployeeActive(id: string, isActive: boolean) {
  const employee = await Employee.findById(id);
  assertFound(employee, 'الموظف غير موجود');
  employee.isActive = isActive;
  await employee.save();
  await User.findByIdAndUpdate(employee.userId, { isActive });
  return employee;
}

export async function deleteEmployee(id: string) {
  const employee = await Employee.findById(id);
  assertFound(employee, 'الموظف غير موجود');

  await Promise.all([
    Attendance.deleteMany({ employeeId: employee._id }),
    User.findByIdAndDelete(employee.userId),
    Employee.findByIdAndDelete(employee._id),
  ]);

  return { id };
}
