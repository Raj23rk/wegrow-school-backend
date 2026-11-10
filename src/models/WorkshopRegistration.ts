import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkshopRegistration extends Document {
  registrationId: string; // e.g. "WS26-4892"
  workshopName: string;
  studentName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  schoolName: string;
  grade: string;
  city: string;
  amount: number; // in INR, e.g. 99
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  receiptNumber?: string;
  notes?: string;
  registeredAt: Date;
  paidAt?: Date;
}

const WorkshopRegistrationSchema = new Schema<IWorkshopRegistration>(
  {
    registrationId: { type: String, required: true, unique: true, index: true },
    workshopName: {
      type: String,
      default: 'WebSpark AI - AI Website Building Workshop',
    },
    studentName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, trim: true },
    schoolName: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    amount: { type: Number, default: 99 },
    currency: { type: String, default: 'INR' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentMethod: { type: String, default: 'razorpay' },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    receiptNumber: { type: String },
    notes: { type: String },
    registeredAt: { type: Date, default: Date.now },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose OverwriteModelError in case of hot-reload
export const WorkshopRegistrationModel =
  mongoose.models.WorkshopRegistration ||
  mongoose.model<IWorkshopRegistration>('WorkshopRegistration', WorkshopRegistrationSchema);

