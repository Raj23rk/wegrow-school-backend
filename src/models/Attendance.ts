import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  studentId: string;
  studentName?: string;
  rollNumber?: string;
  batch?: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // e.g. "09:15 AM"
  checkOutTime?: string; // e.g. "05:30 PM"
  checkInTimestamp?: Date;
  checkOutTimestamp?: Date;
  durationHours?: number; // e.g. 8.25
  status: 'present' | 'absent' | 'late' | 'excused';
  subject?: string;
  session: 'morning' | 'afternoon' | 'full-day';
  remarks?: string;
  checkInMethod?: 'student_portal' | 'admin_manual' | 'biometric';
  createdAt?: Date;
  updatedAt?: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String },
    rollNumber: { type: String, index: true },
    batch: { type: String, index: true },
    date: { type: String, required: true, index: true },
    checkInTime: { type: String },
    checkOutTime: { type: String },
    checkInTimestamp: { type: Date },
    checkOutTimestamp: { type: Date },
    durationHours: { type: Number, default: 0 },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' },
    subject: { type: String },
    session: { type: String, default: 'full-day' },
    remarks: { type: String },
    checkInMethod: { type: String, default: 'student_portal' },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries by student and date
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

export const AttendanceModel = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
