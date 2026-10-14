import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'excused';
  subject?: string;
  session: 'morning' | 'afternoon' | 'full-day';
  remarks?: string;
}

const AttendanceSchema = new Schema<IAttendance>({
  studentId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' },
  subject: { type: String },
  session: { type: String, default: 'full-day' },
  remarks: { type: String },
});

export const AttendanceModel = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
