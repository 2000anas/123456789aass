import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { Currency } from '../types';

dayjs.extend(utc);
dayjs.extend(timezone);

export const APP_TZ = 'Asia/Damascus';

export function formatMoney(amount: number, currency: Currency = 'USD') {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  }).format(amount || 0);

  return currency === 'USD' ? `$${formatted}` : `${formatted} ل.س`;
}

export function formatDate(value?: string | Date) {
  if (!value) return '—';
  return dayjs(value).tz(APP_TZ).format('YYYY-MM-DD');
}

export function formatDateTime(value?: string | Date) {
  if (!value) return '—';
  return dayjs(value).tz(APP_TZ).format('YYYY-MM-DD HH:mm');
}

export function formatTime(value?: string | Date) {
  if (!value) return '—';
  return dayjs(value).tz(APP_TZ).format('HH:mm');
}

export function formatMinutes(totalMinutes?: number) {
  const mins = totalMinutes || 0;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}س ${String(m).padStart(2, '0')}د`;
}

export function todayInputValue() {
  return dayjs().tz(APP_TZ).format('YYYY-MM-DD');
}

export function categoryName(category: { nameAr?: string; name?: string } | string | undefined) {
  if (!category) return '—';
  if (typeof category === 'string') return category;
  return category.nameAr || category.name || '—';
}

export function getUserId(user: { id?: string; _id?: string }) {
  return user.id || user._id || '';
}
