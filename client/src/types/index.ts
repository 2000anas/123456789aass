export type Role = 'admin' | 'employee';
export type Currency = 'USD' | 'SYP';
export type TransactionType = 'IN' | 'OUT';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'incomplete';
export type WeekDay =
  | 'saturday'
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: Role;
  employeeId?: string | { _id: string };
  isActive?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  nameAr: string;
  type: TransactionType;
  isActive: boolean;
}

export interface Transaction {
  _id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  category: Category | string;
  description: string;
  date: string;
  notes?: string;
  createdBy?: User | string;
  balanceAfter?: number | null;
  createdAt?: string;
}

export interface Employee {
  _id: string;
  userId?: User | string;
  fullName: string;
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
  isActive: boolean;
}

export interface Attendance {
  _id: string;
  employeeId: Employee | string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workedMinutes: number;
  lateMinutes: number;
  status: AttendanceStatus;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BalanceBlock {
  totalIn: number;
  totalOut: number;
  balance: number;
}

export interface Balances {
  USD: BalanceBlock;
  SYP: BalanceBlock;
}
