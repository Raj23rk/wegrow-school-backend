import mongoose, { Document, Schema } from 'mongoose';

export interface ITestResult extends Document {
  studentId: string;
  studentName: string;
  studentEmail: string;
  parentEmail: string;
  parentWhatsApp: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  submittedAnswers: { [questionId: string]: number };
  whatsappStatus: 'sent' | 'failed' | 'queued';
  emailStatus: 'sent' | 'failed' | 'queued';
  whatsappMessageSid?: string;
  emailMessageId?: string;
  feedback?: string;
  submittedAt: Date;
}

const TestResultSchema = new Schema<ITestResult>({
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  parentEmail: { type: String, required: true },
  parentWhatsApp: { type: String, required: true },
  quizId: { type: String, required: true },
  quizTitle: { type: String, required: true },
  subject: { type: String, required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  timeSpentSeconds: { type: Number, default: 0 },
  submittedAnswers: { type: Schema.Types.Mixed, default: {} },
  whatsappStatus: { type: String, enum: ['sent', 'failed', 'queued'], default: 'queued' },
  emailStatus: { type: String, enum: ['sent', 'failed', 'queued'], default: 'queued' },
  whatsappMessageSid: { type: String },
  emailMessageId: { type: String },
  feedback: { type: String },
  submittedAt: { type: Date, default: Date.now },
});

export const TestResultModel = mongoose.model<ITestResult>('TestResult', TestResultSchema);
