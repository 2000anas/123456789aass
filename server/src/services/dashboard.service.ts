import { Employee } from '../models/Employee.js';
import * as transactionService from './transaction.service.js';
import * as attendanceService from './attendance.service.js';
import * as reportService from './report.service.js';

export async function getAdminDashboard() {
  const [balances, recentTransactions, todayAttendance, employeeCount, cashFlow, expenses] =
    await Promise.all([
      transactionService.getBalances(),
      transactionService.listTransactions({
        page: 1,
        limit: 8,
        includeRunningBalance: true,
        sort: 'desc',
      }),
      attendanceService.getTodayAttendanceOverview(),
      Employee.countDocuments({ isActive: true }),
      reportService.monthlyCashFlow(6),
      reportService.expenseReport(),
    ]);

  return {
    balances,
    employeeCount,
    todayAttendance,
    recentTransactions: recentTransactions.items,
    charts: {
      monthlyCashFlow: cashFlow,
      expensesByCategory: expenses.items.slice(0, 8),
    },
  };
}
