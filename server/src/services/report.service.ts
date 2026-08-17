import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { parseLocalDate } from '../utils/timezone.js';
import type { Currency } from '../config/env.js';

function dateFilter(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return {};
  const date: Record<string, Date> = {};
  if (startDate) date.$gte = parseLocalDate(startDate).startOf('day').toDate();
  if (endDate) date.$lte = parseLocalDate(endDate).endOf('day').toDate();
  return { date };
}

export async function financialSummary(startDate?: string, endDate?: string) {
  const match = dateFilter(startDate, endDate);
  const rows = await Transaction.aggregate([
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    {
      $group: {
        _id: { currency: '$currency', type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const summary = {
    USD: { totalIn: 0, totalOut: 0, net: 0 },
    SYP: { totalIn: 0, totalOut: 0, net: 0 },
  };

  for (const row of rows) {
    const currency = row._id.currency as Currency;
    if (row._id.type === 'IN') summary[currency].totalIn = row.total;
    if (row._id.type === 'OUT') summary[currency].totalOut = row.total;
  }

  summary.USD.net = summary.USD.totalIn - summary.USD.totalOut;
  summary.SYP.net = summary.SYP.totalIn - summary.SYP.totalOut;

  return { startDate, endDate, summary };
}

export async function expenseReport(startDate?: string, endDate?: string, currency?: Currency) {
  const match: Record<string, unknown> = { type: 'OUT', ...dateFilter(startDate, endDate) };
  if (currency) match.currency = currency;

  const rows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: { category: '$category', currency: '$currency' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const categories = await Category.find({ type: 'OUT' });
  const catMap = new Map(categories.map((c) => [String(c._id), c]));

  const items = rows.map((row) => {
    const cat = catMap.get(String(row._id.category));
    return {
      categoryId: row._id.category,
      name: cat?.name || 'Unknown',
      nameAr: cat?.nameAr || 'غير معروف',
      currency: row._id.currency,
      total: row.total,
      count: row.count,
    };
  });

  const totals = items.reduce(
    (acc, item) => {
      acc[item.currency as Currency] += item.total;
      return acc;
    },
    { USD: 0, SYP: 0 }
  );

  return { startDate, endDate, items, totals };
}

export async function transactionReport(startDate?: string, endDate?: string, currency?: Currency) {
  const filter: Record<string, unknown> = { ...dateFilter(startDate, endDate) };
  if (currency) filter.currency = currency;

  const items = await Transaction.find(filter)
    .populate('category', 'name nameAr type')
    .populate('createdBy', 'name')
    .sort({ date: 1, createdAt: 1 });

  return { startDate, endDate, items };
}

export async function monthlyCashFlow(months = 6) {
  const start = parseLocalDate(
    dayjsStartMonthsAgo(months)
  ).startOf('month').toDate();

  const rows = await Transaction.aggregate([
    { $match: { date: { $gte: start } } },
    {
      $group: {
        _id: {
          year: { $year: { date: '$date', timezone: 'Asia/Damascus' } },
          month: { $month: { date: '$date', timezone: 'Asia/Damascus' } },
          currency: '$currency',
          type: '$type',
        },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  return rows;
}

function dayjsStartMonthsAgo(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - (months - 1));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}
