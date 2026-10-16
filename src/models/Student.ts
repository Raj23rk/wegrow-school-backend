import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  name: string;
  email: string;
  passwordHash: string;
  rollNumber: string;
  grade: string;
  section: string;
  batch?: string;
  schoolName?: string;
  avatar: string;
  dob: string;
  phone: string;
  address: string;
  parentName: string;
  fatherName?: string;
  motherName?: string;
  fatherPhone?: string;
  motherPhone?: string;
  parentEmail: string;
  parentWhatsApp: string;
  bloodGroup: string;
  enrollmentDate: string;
  feeType?: string;
  feePaymentPlan?: string;
  feePlanLabel?: string;
  installmentCount?: number;
  installmentAmount?: number;
  installments?: any[];
  totalFees: number;
  paidFees: number;
  dueFees: number;
  createdAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  grade: { type: String, required: true },
  section: { type: String, default: 'A' },
  batch: { type: String, default: 'Cohort Alpha (12-Month Diploma)' },
  schoolName: { type: String, default: 'WeGrow Campus & Schools Partner' },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  dob: { type: String, default: '2008-05-14' },
  phone: { type: String, default: '+91 98765 43210' },
  address: { type: String, default: '42, Crescent Park, Sivakasi, Tamil Nadu' },
  parentName: { type: String, required: true },
  fatherName: { type: String, default: '' },
  motherName: { type: String, default: '' },
  fatherPhone: { type: String, default: '' },
  motherPhone: { type: String, default: '' },
  parentEmail: { type: String, required: true },
  parentWhatsApp: { type: String, required: true },
  bloodGroup: { type: String, default: 'O+' },
  enrollmentDate: { type: String, default: '2024-06-01' },
  feeType: { type: String, default: 'term' },
  feePaymentPlan: { type: String, default: 'term_payment' },
  feePlanLabel: { type: String, default: '3. Term Payment - ₹45,000 (3 Terms x ₹15,000)' },
  installmentCount: { type: Number, default: 3 },
  installmentAmount: { type: Number, default: 15000 },
  installments: { type: Schema.Types.Mixed, default: [] },
  totalFees: { type: Number, default: 45000 },
  paidFees: { type: Number, default: 0 },
  dueFees: { type: Number, default: 45000 },
  createdAt: { type: Date, default: Date.now },
});

export const StudentModel = mongoose.model<IStudent>('Student', StudentSchema);
