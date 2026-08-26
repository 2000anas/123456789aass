import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { Employee } from '../models/Employee.js';
import { Category } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { Attendance } from '../models/Attendance.js';
import { Settings } from '../models/Settings.js';
import { dayjs, now, parseTimeOnDate, todayDateString } from '../utils/timezone.js';

const defaultCategories = [
  { name: 'Customer Payment', nameAr: 'دفعة عميل', type: 'IN' as const },
  { name: 'Project Payment', nameAr: 'دفعة مشروع', type: 'IN' as const },
  { name: 'Other Income', nameAr: 'دخل آخر', type: 'IN' as const },
  { name: 'Salaries', nameAr: 'رواتب', type: 'OUT' as const },
  { name: 'Rent', nameAr: 'إيجار', type: 'OUT' as const },
  { name: 'Electricity', nameAr: 'كهرباء', type: 'OUT' as const },
  { name: 'Internet', nameAr: 'إنترنت', type: 'OUT' as const },
  { name: 'Purchases', nameAr: 'مشتريات', type: 'OUT' as const },
  { name: 'Transportation', nameAr: 'مواصلات', type: 'OUT' as const },
  { name: 'Office Expenses', nameAr: 'مصاريف مكتبية', type: 'OUT' as const },
  { name: 'Other', nameAr: 'أخرى', type: 'OUT' as const },
];

async function seed() {
  await connectDatabase();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    Category.deleteMany({}),
    Transaction.deleteMany({}),
    Attendance.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  await Settings.create({
    companyName: 'Elyptek',
    companyNameAr: 'إليبتك',
    defaultCurrency: 'USD',
    displayCurrencies: ['USD', 'SYP'],
    timezone: 'Asia/Damascus',
  });

  const categories = await Category.insertMany(defaultCategories);
  const byName = Object.fromEntries(categories.map((c) => [c.name, c]));

  const adminPassword = await bcrypt.hash('change-me', 10);
  const admin = await User.create({
    name: 'مدير النظام',
    email: 'admin@example.com',
    password: adminPassword,
    role: 'admin',
    isActive: true,
  });

  const employeesData = [
    {
      fullName: 'أحمد الخطيب',
      email: 'ahmad@example.com',
      password: 'employee123',
      phone: '+963991111111',
      position: 'مطور برمجيات',
      monthlySalary: 600,
      salaryCurrency: 'USD' as const,
    },
    {
      fullName: 'سارة الحسن',
      email: 'sara@example.com',
      password: 'employee123',
      phone: '+963992222222',
      position: 'مصممة واجهات',
      monthlySalary: 500,
      salaryCurrency: 'USD' as const,
    },
    {
      fullName: 'محمود العلي',
      email: 'mahmoud@example.com',
      password: 'employee123',
      phone: '+963993333333',
      position: 'محاسب',
      monthlySalary: 2500000,
      salaryCurrency: 'SYP' as const,
    },
  ];

  const employees = [];
  for (const data of employeesData) {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      name: data.fullName,
      email: data.email,
      password: hashed,
      role: 'employee',
      isActive: true,
    });
    const employee = await Employee.create({
      userId: user._id,
      fullName: data.fullName,
      phone: data.phone,
      position: data.position,
      monthlySalary: data.monthlySalary,
      salaryCurrency: data.salaryCurrency,
      workingDays: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      dailyWorkingHours: 8,
      expectedStartTime: '09:00',
      expectedEndTime: '17:00',
      weeklyDayOff: 'friday',
      employmentStartDate: dayjs().subtract(3, 'month').toDate(),
      isActive: true,
    });
    user.employeeId = employee._id;
    await user.save();
    employees.push(employee);
  }

  const today = now();
  const sampleTx = [
    {
      type: 'IN' as const,
      amount: 2500,
      currency: 'USD' as const,
      category: byName['Project Payment']._id,
      description: 'دفعة مشروع موقع إليبتك',
      date: today.subtract(20, 'day').toDate(),
    },
    {
      type: 'IN' as const,
      amount: 800,
      currency: 'USD' as const,
      category: byName['Customer Payment']._id,
      description: 'دفعة عميل تسويق رقمي',
      date: today.subtract(12, 'day').toDate(),
    },
    {
      type: 'OUT' as const,
      amount: 400,
      currency: 'USD' as const,
      category: byName['Rent']._id,
      description: 'إيجار المكتب الشهري',
      date: today.subtract(10, 'day').toDate(),
    },
    {
      type: 'OUT' as const,
      amount: 250,
      currency: 'USD' as const,
      category: byName['Office Expenses']._id,
      description: 'مستلزمات مكتبية',
      date: today.subtract(5, 'day').toDate(),
      notes: 'شراء شهري',
    },
    {
      type: 'IN' as const,
      amount: 5000000,
      currency: 'SYP' as const,
      category: byName['Other Income']._id,
      description: 'دخل نقدي محلي',
      date: today.subtract(8, 'day').toDate(),
    },
    {
      type: 'OUT' as const,
      amount: 350000,
      currency: 'SYP' as const,
      category: byName['Internet']._id,
      description: 'فاتورة الإنترنت',
      date: today.subtract(3, 'day').toDate(),
    },
    {
      type: 'OUT' as const,
      amount: 1200,
      currency: 'USD' as const,
      category: byName['Salaries']._id,
      description: 'رواتب جزئية',
      date: today.subtract(2, 'day').toDate(),
    },
  ];

  for (const tx of sampleTx) {
    await Transaction.create({ ...tx, createdBy: admin._id });
  }

  // Sample attendance for current month (past working days)
  for (const employee of employees) {
    for (let i = 1; i <= 10; i++) {
      const date = today.subtract(i, 'day');
      const weekday = date.day();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[weekday];
      if (!employee.workingDays.includes(dayName as never)) continue;

      const dateStr = date.format('YYYY-MM-DD');
      const late = i % 4 === 0;
      const checkIn = parseTimeOnDate(dateStr, late ? '09:20' : '08:55').toDate();
      const checkOut = parseTimeOnDate(dateStr, '17:05').toDate();

      await Attendance.create({
        employeeId: employee._id,
        date: dateStr,
        checkIn,
        checkOut,
        workedMinutes: Math.round((checkOut.getTime() - checkIn.getTime()) / 60000),
        lateMinutes: late ? 20 : 0,
        status: late ? 'late' : 'present',
      });
    }
  }

  console.log('\n✅ Seed completed successfully\n');
  console.log('Admin (DEV ONLY — change password):');
  console.log('  Email:    admin@example.com');
  console.log('  Password: change-me');
  console.log('\nEmployees:');
  console.log('  ahmad@example.com / employee123');
  console.log('  sara@example.com / employee123');
  console.log('  mahmoud@example.com / employee123');
  console.log(`\nToday: ${todayDateString()}`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
