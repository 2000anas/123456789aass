import { Attendance, AttendanceStatus } from '../models/Attendance.js';
import { Employee, IEmployee } from '../models/Employee.js';
import { AppError, assertFound } from '../utils/AppError.js';
import {
  dayjs,
  formatTime,
  getWeekDay,
  minutesBetween,
  now,
  parseTimeOnDate,
  todayDateString,
  toDateString,
} from '../utils/timezone.js';

function computeLateMinutes(employee: IEmployee, checkIn: Date, date: string): number {
  const expected = parseTimeOnDate(date, employee.expectedStartTime);
  const actual = dayjs(checkIn);
  if (actual.isAfter(expected)) {
    return Math.round(actual.diff(expected, 'minute', true));
  }
  return 0;
}

function deriveStatus(lateMinutes: number, checkOut?: Date | null): AttendanceStatus {
  if (!checkOut) return 'incomplete';
  return lateMinutes > 0 ? 'late' : 'present';
}

export async function checkIn(employeeId: string) {
  const employee = await Employee.findById(employeeId);
  assertFound(employee, 'الموظف غير موجود');
  if (!employee.isActive) throw new AppError('حساب الموظف غير نشط');

  const date = todayDateString();
  const weekday = getWeekDay(now());
  if (!employee.workingDays.includes(weekday)) {
    throw new AppError('اليوم ليس من أيام العمل المحددة لك');
  }

  const existing = await Attendance.findOne({ employeeId, date });
  if (existing?.checkIn) {
    throw new AppError('تم تسجيل الحضور مسبقاً لهذا اليوم');
  }

  const checkInTime = now().toDate();
  const lateMinutes = computeLateMinutes(employee, checkInTime, date);
  const status = deriveStatus(lateMinutes, null);

  if (existing) {
    existing.checkIn = checkInTime;
    existing.lateMinutes = lateMinutes;
    existing.status = status;
    await existing.save();
    return existing;
  }

  return Attendance.create({
    employeeId,
    date,
    checkIn: checkInTime,
    lateMinutes,
    workedMinutes: 0,
    status,
  });
}

export async function checkOut(employeeId: string) {
  const employee = await Employee.findById(employeeId);
  assertFound(employee, 'الموظف غير موجود');

  const date = todayDateString();
  const record = await Attendance.findOne({ employeeId, date });
  if (!record?.checkIn) {
    throw new AppError('يجب تسجيل الحضور أولاً');
  }
  if (record.checkOut) {
    throw new AppError('تم تسجيل الانصراف مسبقاً لهذا اليوم');
  }

  const checkOutTime = now().toDate();
  record.checkOut = checkOutTime;
  record.workedMinutes = minutesBetween(record.checkIn, checkOutTime);
  record.status = deriveStatus(record.lateMinutes, checkOutTime);
  await record.save();
  return record;
}

export async function getTodayForEmployee(employeeId: string) {
  const employee = await Employee.findById(employeeId);
  assertFound(employee, 'الموظف غير موجود');

  const date = todayDateString();
  const record = await Attendance.findOne({ employeeId, date });
  const weekday = getWeekDay(now());
  const isWorkingDay = employee.workingDays.includes(weekday);

  return {
    date,
    isWorkingDay,
    expectedStartTime: employee.expectedStartTime,
    expectedEndTime: employee.expectedEndTime,
    attendance: record,
    canCheckIn: isWorkingDay && !record?.checkIn,
    canCheckOut: Boolean(record?.checkIn && !record?.checkOut),
  };
}

export async function listAttendance(query: {
  employeeId?: string;
  date?: string;
  month?: string;
  year?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
  const filter: Record<string, unknown> = {};

  if (query.employeeId) filter.employeeId = query.employeeId;
  if (query.date) filter.date = query.date;
  if (query.status) filter.status = query.status;

  if (query.year && query.month) {
    const month = query.month.padStart(2, '0');
    filter.date = { $regex: `^${query.year}-${month}` };
  } else if (query.year) {
    filter.date = { $regex: `^${query.year}` };
  }

  const [items, total] = await Promise.all([
    Attendance.find(filter)
      .populate('employeeId', 'fullName position expectedStartTime expectedEndTime')
      .sort({ date: -1, checkIn: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Attendance.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
}

export async function getTodayAttendanceOverview() {
  const date = todayDateString();
  const employees = await Employee.find({ isActive: true });
  const records = await Attendance.find({ date });
  const byEmployee = new Map(records.map((r) => [String(r.employeeId), r]));

  const weekday = getWeekDay(now());
  let present = 0;
  let late = 0;
  let absent = 0;
  let notCheckedIn = 0;

  const rows = employees
    .filter((emp) => emp.workingDays.includes(weekday))
    .map((emp) => {
      const record = byEmployee.get(String(emp._id));
      let status: AttendanceStatus | 'not_checked_in' = 'not_checked_in';

      if (!record) {
        notCheckedIn += 1;
        status = 'not_checked_in';
      } else if (record.status === 'late') {
        late += 1;
        status = 'late';
      } else if (record.status === 'present') {
        present += 1;
        status = 'present';
      } else if (record.status === 'incomplete') {
        if (record.lateMinutes > 0) {
          late += 1;
          status = 'late';
        } else {
          present += 1;
          status = 'present';
        }
      } else if (record.status === 'absent') {
        absent += 1;
        status = 'absent';
      }

      return {
        employeeId: emp._id,
        fullName: emp.fullName,
        checkIn: record?.checkIn ? formatTime(record.checkIn) : null,
        checkOut: record?.checkOut ? formatTime(record.checkOut) : null,
        status,
        workedMinutes: record?.workedMinutes ?? 0,
        lateMinutes: record?.lateMinutes ?? 0,
      };
    });

  return {
    date,
    summary: { present, late, absent, notCheckedIn, totalExpected: rows.length },
    items: rows,
  };
}

export async function updateAttendance(
  id: string,
  data: {
    checkIn?: string | null;
    checkOut?: string | null;
    status?: AttendanceStatus;
    lateMinutes?: number;
    workedMinutes?: number;
    notes?: string;
  }
) {
  const record = await Attendance.findById(id);
  assertFound(record, 'سجل الحضور غير موجود');

  if (data.checkIn !== undefined) {
    record.checkIn = data.checkIn ? dayjs(data.checkIn).toDate() : undefined;
  }
  if (data.checkOut !== undefined) {
    record.checkOut = data.checkOut ? dayjs(data.checkOut).toDate() : undefined;
  }
  if (typeof data.lateMinutes === 'number') record.lateMinutes = data.lateMinutes;
  if (typeof data.workedMinutes === 'number') record.workedMinutes = data.workedMinutes;
  if (data.notes !== undefined) record.notes = data.notes;

  if (data.status) {
    record.status = data.status;
  } else if (record.checkIn && !record.checkOut) {
    record.status = 'incomplete';
  } else if (record.checkIn && record.checkOut) {
    if (!data.workedMinutes && record.checkIn && record.checkOut) {
      record.workedMinutes = minutesBetween(record.checkIn, record.checkOut);
    }
    record.status = record.lateMinutes > 0 ? 'late' : 'present';
  }

  await record.save();
  return Attendance.findById(id).populate(
    'employeeId',
    'fullName position expectedStartTime expectedEndTime'
  );
}

export async function getEmployeeAttendanceHistory(employeeId: string, limit = 30) {
  return Attendance.find({ employeeId }).sort({ date: -1 }).limit(limit);
}

export { toDateString };
