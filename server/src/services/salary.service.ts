import { Attendance } from '../models/Attendance.js';
import { Employee } from '../models/Employee.js';
import { assertFound } from '../utils/AppError.js';
import { dayjs, getWeekDay, parseLocalDate, toDateString } from '../utils/timezone.js';

export async function calculateMonthlySalary(employeeId: string, year: number, month: number) {
  const employee = await Employee.findById(employeeId);
  assertFound(employee, 'الموظف غير موجود');

  const start = dayjs.tz(`${year}-${String(month).padStart(2, '0')}-01`, 'YYYY-MM-DD', 'Asia/Damascus');
  const end = start.endOf('month');
  const today = dayjs().tz('Asia/Damascus').startOf('day');
  const employmentStart = dayjs(employee.employmentStartDate).tz('Asia/Damascus').startOf('day');

  const expectedDates: string[] = [];
  let cursor = start.startOf('day');

  while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
    const weekday = getWeekDay(cursor);
    const dateStr = cursor.format('YYYY-MM-DD');
    const isWorkingDay = employee.workingDays.includes(weekday) && weekday !== employee.weeklyDayOff;
    const afterEmployment = !cursor.isBefore(employmentStart, 'day');
    const notFuture = !cursor.isAfter(today, 'day');

    if (isWorkingDay && afterEmployment && notFuture) {
      expectedDates.push(dateStr);
    }
    cursor = cursor.add(1, 'day');
  }

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const records = await Attendance.find({
    employeeId,
    date: { $regex: `^${monthPrefix}` },
  });

  const byDate = new Map(records.map((r) => [r.date, r]));

  let presentDays = 0;
  let lateDays = 0;
  let incompleteDays = 0;
  let absentDays = 0;
  let totalLateMinutes = 0;

  for (const date of expectedDates) {
    const record = byDate.get(date);
    if (!record || record.status === 'absent' || !record.checkIn) {
      absentDays += 1;
      continue;
    }

    totalLateMinutes += record.lateMinutes || 0;

    if (record.status === 'incomplete' || (record.checkIn && !record.checkOut)) {
      incompleteDays += 1;
      if (record.lateMinutes > 0) lateDays += 1;
      else presentDays += 1;
    } else if (record.status === 'late' || record.lateMinutes > 0) {
      lateDays += 1;
      presentDays += 1;
    } else {
      presentDays += 1;
    }
  }

  const expectedWorkingDays = expectedDates.length;
  const monthlySalary = employee.monthlySalary;
  const dailyRate = expectedWorkingDays > 0 ? monthlySalary / expectedWorkingDays : 0;
  const hourlyRate =
    employee.dailyWorkingHours > 0 ? dailyRate / employee.dailyWorkingHours : 0;
  const lateHours = totalLateMinutes / 60;
  const absenceDeduction = absentDays * dailyRate;
  const lateDeduction = lateHours * hourlyRate;
  const finalSalary = Math.max(0, monthlySalary - absenceDeduction - lateDeduction);

  return {
    employee: {
      id: employee._id,
      fullName: employee.fullName,
      position: employee.position,
      salaryCurrency: employee.salaryCurrency,
      dailyWorkingHours: employee.dailyWorkingHours,
      expectedStartTime: employee.expectedStartTime,
      expectedEndTime: employee.expectedEndTime,
      workingDays: employee.workingDays,
      weeklyDayOff: employee.weeklyDayOff,
    },
    period: { year, month, startDate: start.format('YYYY-MM-DD'), endDate: end.format('YYYY-MM-DD') },
    monthlySalary,
    expectedWorkingDays,
    presentDays,
    lateDays,
    absentDays,
    incompleteDays,
    lateMinutes: totalLateMinutes,
    dailyRate: round2(dailyRate),
    hourlyRate: round2(hourlyRate),
    absenceDeduction: round2(absenceDeduction),
    lateDeduction: round2(lateDeduction),
    finalSalary: round2(finalSalary),
    currency: employee.salaryCurrency,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export { parseLocalDate, toDateString };
