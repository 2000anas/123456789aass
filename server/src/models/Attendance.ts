import mongoose, { Document, Schema, Types } from 'mongoose';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'incomplete';

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  employeeId: Types.ObjectId;
  date: string;
  checkIn?: Date;
  checkOut?: Date;
  workedMinutes: number;
  lateMinutes: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    workedMinutes: { type: Number, default: 0 },
    lateMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'incomplete'],
      required: true,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
