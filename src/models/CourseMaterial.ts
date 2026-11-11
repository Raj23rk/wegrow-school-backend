import mongoose, { Document, Schema } from 'mongoose';

export interface ICourseMaterial {
  _id: string;
  title: string;
  subject: string;
  grade: string;
  date: string; // YYYY-MM-DD
  teacher: string;
  summary: string;
  content: string; // Detailed class notes text or markdown
  pdfUrl?: string;
  downloadRestricted: boolean;
  tags: string[];
  views: number;
}

const CourseMaterialSchema = new Schema<ICourseMaterial>(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    date: { type: String, required: true },
    teacher: { type: String, required: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    pdfUrl: { type: String },
    downloadRestricted: { type: Boolean, default: false },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
  },
  { _id: false }
);

export const CourseMaterialModel =
  mongoose.models.CourseMaterial ||
  mongoose.model<ICourseMaterial>('CourseMaterial', CourseMaterialSchema);
