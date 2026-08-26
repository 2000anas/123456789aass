import mongoose, { Document, Schema, Types } from 'mongoose';
import type { Currency } from '../config/env.js';

export type TransactionType = 'IN' | 'OUT';

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  type: TransactionType;
  amount: number;
  currency: Currency;
  category: Types.ObjectId;
  description: string;
  date: Date;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, enum: ['USD', 'SYP'], required: true, default: 'USD' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, currency: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
