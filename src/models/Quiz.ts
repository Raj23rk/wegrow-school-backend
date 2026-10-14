import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number; // 0-indexed
  explanation?: string;
  marks: number;
}

export interface IQuiz extends Document {
  title: string;
  subject: string;
  grade: string;
  description: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  dueDate: string;
  questions: IQuestion[];
  createdDate: string;
  status: 'active' | 'archived';
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  explanation: { type: String },
  marks: { type: Number, default: 1 },
});

const QuizSchema = new Schema<IQuiz>({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  grade: { type: String, required: true },
  description: { type: String, default: '' },
  durationMinutes: { type: Number, default: 15 },
  totalMarks: { type: Number, required: true },
  passingMarks: { type: Number, required: true },
  dueDate: { type: String, required: true },
  questions: [QuestionSchema],
  createdDate: { type: String, default: () => new Date().toISOString() },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
});

export const QuizModel = mongoose.model<IQuiz>('Quiz', QuizSchema);
