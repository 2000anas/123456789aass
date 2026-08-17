import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isoWeek from 'dayjs/plugin/isoWeek.js';
import { env } from '../config/env.js';
import type { WeekDay } from '../config/env.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);

dayjs.tz.setDefault(env.timezone);

export { dayjs };

export function now(): dayjs.Dayjs {
  return dayjs().tz(env.timezone);
}

export function todayDateString(): string {
  return now().format('YYYY-MM-DD');
}

export function toDateString(date: Date | string): string {
  return dayjs(date).tz(env.timezone).format('YYYY-MM-DD');
}

export function parseLocalDate(dateStr: string): dayjs.Dayjs {
  return dayjs.tz(dateStr, 'YYYY-MM-DD', env.timezone);
}

export function formatTime(date: Date | string): string {
  return dayjs(date).tz(env.timezone).format('HH:mm');
}

export function parseTimeOnDate(dateStr: string, timeHHmm: string): dayjs.Dayjs {
  return dayjs.tz(`${dateStr} ${timeHHmm}`, 'YYYY-MM-DD HH:mm', env.timezone);
}

const DAY_MAP: Record<number, WeekDay> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export function getWeekDay(date: dayjs.Dayjs): WeekDay {
  return DAY_MAP[date.day()];
}

export function minutesBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round(dayjs(end).diff(dayjs(start), 'minute', true)));
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}س ${minutes.toString().padStart(2, '0')}د`;
}
