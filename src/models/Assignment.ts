import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignmentSubmission {
  studentId: string;
  studentName: string;
  submittedAt: Date;
  content: string;
  attachmentUrl?: string;
  grade?: string;
  marksObtained?: number;
  teacherRemarks?: string;
  status: 'submitted' | 'graded';
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  grade: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  totalMarks: number;
  submissions: IAssignmentSubmission[];
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  content: { type: String, required: true },
  attachmentUrl: { type: String },
  grade: { type: String },
  marksObtained: { type: Number },
  teacherRemarks: { type: String },
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
});

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  grade: { type: String, required: true },
  description: { type: String, required: true },
  assignedDate: { type: String, required: true },
  dueDate: { type: String, required: true },
  totalMarks: { type: Number, default: 100 },
  submissions: [AssignmentSubmissionSchema],
});

export const AssignmentModel = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
