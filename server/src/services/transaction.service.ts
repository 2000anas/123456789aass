import { Types } from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { Category } from '../models/Category.js';
import { AppError, assertFound } from '../utils/AppError.js';
import { parseLocalDate } from '../utils/timezone.js';
import type { Currency } from '../config/env.js';

export interface TransactionInput {
  type: 'IN' | 'OUT';
  amount: number;
  currency: Currency;
  category: string;
  description: string;
  date: string;
  notes?: string;
}

export async function getBalances() {
  const result = await Transaction.aggregate([
    {
      $group: {
        _id: { currency: '$currency', type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const balances = {
    USD: { totalIn: 0, totalOut: 0, balance: 0 },
    SYP: { totalIn: 0, totalOut: 0, balance: 0 },
  };

  for (const row of result) {
    const currency = row._id.currency as Currency;
    if (row._id.type === 'IN') balances[currency].totalIn = row.total;
    if (row._id.type === 'OUT') balances[currency].totalOut = row.total;
  }

  balances.USD.balance = balances.USD.totalIn - balances.USD.totalOut;
  balances.SYP.balance = balances.SYP.totalIn - balances.SYP.totalOut;

  return balances;
}

export async function listTransactions(query: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  currency?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sort?: 'asc' | 'desc';
  includeRunningBalance?: boolean;
}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const filter: Record<string, unknown> = {};

  if (query.type) filter.type = query.type;
  if (query.category) filter.category = query.category;
  if (query.currency) filter.currency = query.currency;
  if (query.search) {
    filter.$or = [
      { description: { $regex: query.search, $options: 'i' } },
      { notes: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) {
      (filter.date as Record<string, Date>).$gte = parseLocalDate(query.startDate).startOf('day').toDate();
    }
    if (query.endDate) {
      (filter.date as Record<string, Date>).$lte = parseLocalDate(query.endDate).endOf('day').toDate();
    }
  }

  const sortDir = query.sort === 'asc' ? 1 : -1;

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .populate('category', 'name nameAr type')
      .populate('createdBy', 'name email')
      .sort({ date: sortDir, createdAt: sortDir })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  let withBalance: any[] = items.map((item) => item.toObject());

  if (query.includeRunningBalance) {
    const chronological = await Transaction.find(filter).sort({ date: 1, createdAt: 1 });
    const running: Record<Currency, number> = { USD: 0, SYP: 0 };
    const balanceMap = new Map<string, number>();

    for (const tx of chronological) {
      const delta = tx.type === 'IN' ? tx.amount : -tx.amount;
      running[tx.currency] += delta;
      balanceMap.set(String(tx._id), running[tx.currency]);
    }

    withBalance = withBalance.map((tx) => ({
      ...tx,
      balanceAfter: balanceMap.get(String(tx._id)) ?? null,
    }));
  }

  return {
    items: withBalance,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function createTransaction(input: TransactionInput, userId: string) {
  const category = await Category.findById(input.category);
  assertFound(category, 'التصنيف غير موجود');
  if (category.type !== input.type) {
    throw new AppError('نوع التصنيف لا يطابق نوع العملية');
  }

  const tx = await Transaction.create({
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    category: new Types.ObjectId(input.category),
    description: input.description,
    date: parseLocalDate(input.date).toDate(),
    notes: input.notes,
    createdBy: new Types.ObjectId(userId),
  });

  return Transaction.findById(tx._id)
    .populate('category', 'name nameAr type')
    .populate('createdBy', 'name email');
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const existing = await Transaction.findById(id);
  assertFound(existing, 'العملية غير موجودة');

  const category = await Category.findById(input.category);
  assertFound(category, 'التصنيف غير موجود');
  if (category.type !== input.type) {
    throw new AppError('نوع التصنيف لا يطابق نوع العملية');
  }

  existing.type = input.type;
  existing.amount = input.amount;
  existing.currency = input.currency;
  existing.category = new Types.ObjectId(input.category);
  existing.description = input.description;
  existing.date = parseLocalDate(input.date).toDate();
  existing.notes = input.notes;
  await existing.save();

  return Transaction.findById(id)
    .populate('category', 'name nameAr type')
    .populate('createdBy', 'name email');
}

export async function deleteTransaction(id: string) {
  const existing = await Transaction.findByIdAndDelete(id);
  assertFound(existing, 'العملية غير موجودة');
  return existing;
}

export async function listCategories(type?: string, includeInactive = false) {
  const filter: Record<string, unknown> = {};
  if (!includeInactive) filter.isActive = true;
  if (type) filter.type = type;
  return Category.find(filter).sort({ type: 1, nameAr: 1 });
}

export async function createCategory(data: { name?: string; nameAr: string; type: 'IN' | 'OUT' }) {
  const name = data.name?.trim() || data.nameAr.trim();
  return Category.create({ ...data, name, nameAr: data.nameAr.trim() });
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; nameAr: string; type: 'IN' | 'OUT'; isActive: boolean }>
) {
  const category = await Category.findByIdAndUpdate(id, data, { new: true });
  assertFound(category, 'التصنيف غير موجود');
  return category;
}

export async function deleteCategory(id: string) {
  const category = await Category.findById(id);
  assertFound(category, 'التصنيف غير موجود');

  const usedCount = await Transaction.countDocuments({ category: category._id });
  if (usedCount > 0) {
    category.isActive = false;
    await category.save();
    return { deleted: false, deactivated: true, usedCount };
  }

  await Category.findByIdAndDelete(id);
  return { deleted: true, deactivated: false, usedCount: 0 };
}
