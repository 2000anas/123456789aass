import mongoose, { Document, Schema, Types } from 'mongoose';
import type { TransactionType } from './Transaction.js';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  nameAr: string;
  type: TransactionType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    nameAr: { type: String, required: true, trim: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1, type: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
