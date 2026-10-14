import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminUser extends Document {
  name: string;
  email: string;
  employeeId: string;
  passwordHash: string;
  role: string;
  department?: string;
  avatar?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'admin' },
    department: { type: String, default: 'Campus Administration' },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80' },
    phone: { type: String, default: '+91 98765 00001' },
  },
  { timestamps: true }
);

export const AdminUserModel =
  mongoose.models.AdminUser || mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);
