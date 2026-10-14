import mongoose, { Document, Schema } from 'mongoose';

export interface IClassSchedule extends Document {
  subject: string;
  topic: string;
  teacher: string;
  room: string;
  grade: string;
  startTime: string;
  endTime: string;
  status: 'ongoing' | 'upcoming' | 'completed';
  meetingUrl?: string;
  date: string;
}

const ClassScheduleSchema = new Schema<IClassSchedule>({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  teacher: { type: String, required: true },
  room: { type: String, default: 'Room 204' },
  grade: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: ['ongoing', 'upcoming', 'completed'], default: 'upcoming' },
  meetingUrl: { type: String },
  date: { type: String, required: true },
});

export const ClassScheduleModel = mongoose.model<IClassSchedule>('ClassSchedule', ClassScheduleSchema);
