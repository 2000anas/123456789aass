import mongoose, { Document, Schema, Types } from 'mongoose';
import type { Currency, WeekDay } from '../config/env.js';

export interface IEmployee extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fullName: string;
  phone?: string;
  position: string;
  monthlySalary: number;
  salaryCurrency: Currency;
  workingDays: WeekDay[];
  dailyWorkingHours: number;
  expectedStartTime: string;
  expectedEndTime: string;
  weeklyDayOff: WeekDay;
  employmentStartDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    position: { type: String, required: true, trim: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    salaryCurrency: { type: String, enum: ['USD', 'SYP'], default: 'USD' },
    workingDays: {
      type: [String],
      required: true,
      default: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    },
    dailyWorkingHours: { type: Number, required: true, default: 8, min: 1, max: 24 },
    expectedStartTime: { type: String, required: true, default: '09:00' },
    expectedEndTime: { type: String, required: true, default: '17:00' },
    weeklyDayOff: { type: String, required: true, default: 'friday' },
    employmentStartDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
