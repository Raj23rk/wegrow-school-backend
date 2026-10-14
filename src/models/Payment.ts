import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  studentId: string;
  studentName: string;
  orderId: string;
  paymentId: string;
  amount: number; // in INR
  currency: string;
  feeType: string; // e.g. "Term 2 Tuition Fee", "Lab & Activity Fee"
  status: 'created' | 'paid' | 'failed';
  receiptNumber: string;
  date: Date;
}

const PaymentSchema = new Schema<IPayment>({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  orderId: { type: String, required: true },
  paymentId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  feeType: { type: String, default: 'Tuition Fee' },
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  receiptNumber: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

export const PaymentModel = mongoose.model<IPayment>('Payment', PaymentSchema);
