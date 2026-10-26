import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env.js';
import { StudentModel } from '../models/Student.js';
import { isMongoConnected } from '../db/mongo.js';
import { ADMIN_STUDENTS } from './admin.js';
import {
  findAdminUser,
  verifyAdminPassword,
  toAdminResponseUser,
} from '../data/adminUsers.js';
import { resolveStudentFeeDetails, getNextDueInstallment } from '../services/feeService.js';

export const authRouter = new Hono();

// Helper to look up student by enrollment ID / roll number or email (prioritizing unique rollNumber / ID)
async function findStudentByIdentifier(identifier: string) {
  const cleanId = (identifier || '').trim().toLowerCase();
  if (!cleanId) return null;

  // 1. Check in-memory ADMIN_STUDENTS roster - prioritize roll number / id match
  let fromAdmin = ADMIN_STUDENTS.find((s) => {
    const roll = (s.rollNumber || '').trim().toLowerCase();
    const id = (s.id || s._id || '').toString().trim().toLowerCase();
    return roll === cleanId || id === cleanId;
  });
  if (!fromAdmin) {
    fromAdmin = ADMIN_STUDENTS.find((s) => (s.email || '').trim().toLowerCase() === cleanId);
  }
  if (fromAdmin) return fromAdmin;

  // 2. Check MongoDB if connected
  if (isMongoConnected()) {
    try {
      let student = await StudentModel.findOne({
        $or: [
          { rollNumber: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
          ...(cleanId.length === 24 ? [{ _id: cleanId }] : []),
        ],
      });
      if (!student) {
        student = await StudentModel.findOne({
          email: { $regex: new RegExp(`^${cleanId}$`, 'i') },
        });
      }
      if (student) return student;
    } catch (e) {
      console.warn('[Auth] MongoDB query fallback:', e);
    }
  }

  return null;
}

// Helper to look up all student candidates matching identifier (handles siblings sharing parent email)
async function findStudentsByIdentifier(identifier: string): Promise<any[]> {
  const cleanId = (identifier || '').trim().toLowerCase();
  if (!cleanId) return [];

  const candidates: any[] = [];
  const seenIds = new Set<string>();

  const addCandidate = (s: any) => {
    const sId = (s.rollNumber || s._id || s.id || '').toString().toLowerCase();
    if (sId && !seenIds.has(sId)) {
      seenIds.add(sId);
      candidates.push(s);
    }
  };

  // 1. Check in-memory ADMIN_STUDENTS roster
  for (const s of ADMIN_STUDENTS) {
    const roll = (s.rollNumber || '').trim().toLowerCase();
    const email = (s.email || '').trim().toLowerCase();
    const id = (s.id || s._id || '').toString().trim().toLowerCase();
    if (roll === cleanId || email === cleanId || id === cleanId) {
      addCandidate(s);
    }
  }

  // 2. Check MongoDB if connected
  if (isMongoConnected()) {
    try {
      const dbStudents = await StudentModel.find({
        $or: [
          { rollNumber: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
          { email: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
        ],
      });
      for (const s of dbStudents) {
        addCandidate(s);
      }
    } catch (e) {
      console.warn('[Auth] MongoDB candidates query fallback:', e);
    }
  }

  return candidates;
}

authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const identifier = (body.email || body.username || body.identifier || '').trim();
    const password = (body.password || '').trim();

    if (!identifier || !password) {
      return c.json({ success: false, message: 'Username/email and password are required' }, 400);
    }

    // 1. Institutional Admin Authentication Check (All 23 Faculty/Admin Accounts)
    const adminUser = await findAdminUser(identifier);
    if (adminUser) {
      const isPasswordValid = verifyAdminPassword(adminUser, password);
      if (!isPasswordValid) {
        return c.json({ success: false, message: 'Invalid admin credentials. Password does not match.' }, 401);
      }

      const adminPayload = toAdminResponseUser(adminUser);
      const token = jwt.sign(
        {
          id: adminPayload.id,
          email: adminPayload.email,
          name: adminPayload.name,
          role: 'admin',
          rollNumber: adminPayload.rollNumber,
        },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return c.json({
        success: true,
        message: `Admin login successful! Welcome, ${adminPayload.name}.`,
        token,
        student: adminPayload,
      });
    }

    // 2. Student Authentication (by Roll No / Enrollment ID or Email)
    // Supports siblings / two children sharing the same parent email
    const candidateStudents = await findStudentsByIdentifier(identifier);

    if (!candidateStudents || candidateStudents.length === 0) {
      return c.json({ success: false, message: 'No student or admin account found with these credentials' }, 401);
    }

    let student = null;
    for (const cand of candidateStudents) {
      const hasHash = Boolean(cand.passwordHash);
      const isHashMatch = hasHash ? bcrypt.compareSync(password, cand.passwordHash) : false;
      const isDirectMatch = Boolean(cand.password && cand.password === password);
      const isEnrollmentPassword = Boolean(cand.rollNumber && password === `${cand.rollNumber}@2026`);

      if (isHashMatch || isDirectMatch || isEnrollmentPassword) {
        student = cand;
        break;
      }
    }

    if (!student) {
      return c.json({ success: false, message: 'Invalid credentials. Password does not match.' }, 401);
    }

    const studentId = student._id || student.id || `std_${Date.now()}`;
    const token = jwt.sign(
      {
        id: studentId,
        email: student.email,
        name: student.name,
        rollNumber: student.rollNumber,
        role: 'student',
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const feeDetails = resolveStudentFeeDetails({
      feeType: student.feeType || student.feePaymentPlan,
      customTotalFees: student.totalFees,
      paidFees: student.paidFees || 0,
    });
    const studentInstallments = (student.installments && student.installments.length > 0)
      ? student.installments
      : feeDetails.installments;
    const nextDue = getNextDueInstallment(studentInstallments);

    const studentSafe = {
      id: studentId,
      _id: studentId,
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      role: 'student',
      grade: student.grade || student.className || 'AI & GenAI Master Track',
      section: student.section || student.batch || 'Cohort Alpha (12-Month Diploma)',
      avatar: student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      phone: student.phone || student.fatherPhone || '+91 98765 43210',
      address: student.address || student.schoolName || 'WeGrow Skill Campus, Sivakasi',
      dob: student.dob || '2005-01-01',
      bloodGroup: student.bloodGroup || 'O+',
      parentName: student.parentName || student.fatherName || 'Parent',
      parentEmail: student.parentEmail || student.email,
      parentWhatsApp: student.parentWhatsApp || student.fatherPhone || '+919876543210',
      feeType: student.feeType || feeDetails.feeType,
      feePaymentPlan: student.feePaymentPlan || feeDetails.feePaymentPlan,
      feePlanLabel: student.feePlanLabel || feeDetails.feePlanLabel,
      installmentCount: student.installmentCount || feeDetails.installmentCount,
      installmentAmount: student.installmentAmount || feeDetails.installmentAmount,
      totalFees: feeDetails.totalFees,
      paidFees: feeDetails.paidFees,
      dueFees: feeDetails.dueFees,
      installments: studentInstallments,
      nextDueInstallment: nextDue,
    };

    return c.json({
      success: true,
      message: 'Login successful',
      token,
      student: studentSafe,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message || 'Login failed' }, 500);
  }
});

authRouter.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;

    // Check if token belongs to an administrator
    if (decoded.role === 'admin') {
      const adminLookup = await findAdminUser(decoded.email || decoded.rollNumber || decoded.id);
      return c.json({
        success: true,
        student: toAdminResponseUser(adminLookup || decoded),
      });
    }

    const identifier = decoded.rollNumber || decoded.email || decoded.id;
    const student = await findStudentByIdentifier(identifier);

    if (!student) {
      return c.json({ success: false, message: 'Student not found' }, 404);
    }

    const studentId = student._id || student.id || decoded.id;
    const feeDetails = resolveStudentFeeDetails({
      feeType: student.feeType || student.feePaymentPlan,
      customTotalFees: student.totalFees,
      paidFees: student.paidFees || 0,
    });
    const studentInstallments = (student.installments && student.installments.length > 0)
      ? student.installments
      : feeDetails.installments;
    const nextDue = getNextDueInstallment(studentInstallments);

    return c.json({
      success: true,
      student: {
        id: studentId,
        _id: studentId,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        role: 'student',
        grade: student.grade || student.className || 'AI & GenAI Master Track',
        section: student.section || student.batch || 'Cohort Alpha (12-Month Diploma)',
        avatar: student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        phone: student.phone || student.fatherPhone || '+91 98765 43210',
        address: student.address || student.schoolName || 'WeGrow Skill Campus, Sivakasi',
        dob: student.dob || '2005-01-01',
        bloodGroup: student.bloodGroup || 'O+',
        parentName: student.parentName || student.fatherName || 'Parent',
        parentEmail: student.parentEmail || student.email,
        parentWhatsApp: student.parentWhatsApp || student.fatherPhone || '+919876543210',
        feeType: student.feeType || feeDetails.feeType,
        feePaymentPlan: student.feePaymentPlan || feeDetails.feePaymentPlan,
        feePlanLabel: student.feePlanLabel || feeDetails.feePlanLabel,
        installmentCount: student.installmentCount || feeDetails.installmentCount,
        installmentAmount: student.installmentAmount || feeDetails.installmentAmount,
        totalFees: feeDetails.totalFees,
        paidFees: feeDetails.paidFees,
        dueFees: feeDetails.dueFees,
        installments: studentInstallments,
        nextDueInstallment: nextDue,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: 'Invalid or expired token' }, 401);
  }
});

authRouter.put('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    let emailFromToken = '';
    let rollFromToken = '';
    let idFromToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], ENV.JWT_SECRET) as any;
        emailFromToken = decoded.email || '';
        rollFromToken = decoded.rollNumber || '';
        idFromToken = decoded.id || decoded._id || '';
      } catch {}
    }

    const body = await c.req.json();
    const { name, phone, address, parentName, parentEmail, parentWhatsApp, avatar } = body;

    // Update in ADMIN_STUDENTS if present (match by id/rollNumber first)
    const st = ADMIN_STUDENTS.find((s) =>
      (idFromToken && (s.id === idFromToken || s._id === idFromToken)) ||
      (rollFromToken && s.rollNumber === rollFromToken) ||
      (emailFromToken && s.email === emailFromToken)
    );
    if (st) {
      if (name) st.name = name;
      if (phone) st.phone = phone;
      if (address) st.address = address;
      if (parentName) st.parentName = parentName;
      if (parentEmail) st.parentEmail = parentEmail;
      if (parentWhatsApp) st.parentWhatsApp = parentWhatsApp;
      if (avatar) st.avatar = avatar;
    }

    if (isMongoConnected() && (idFromToken || rollFromToken || emailFromToken)) {
      const matchConditions: any[] = [];
      if (idFromToken) matchConditions.push({ _id: idFromToken });
      if (rollFromToken) matchConditions.push({ rollNumber: rollFromToken });
      if (matchConditions.length === 0 && emailFromToken) matchConditions.push({ email: emailFromToken });

      await StudentModel.findOneAndUpdate(
        { $or: matchConditions },
        { name, phone, address, parentName, parentEmail, parentWhatsApp, ...(avatar ? { avatar } : {}) },
        { new: true }
      );
    }

    return c.json({
      success: true,
      message: 'Profile updated successfully',
      student: st || body,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Profile Photo Upload Endpoint
authRouter.post('/upload-avatar', async (c) => {
  try {
    const body = await c.req.json();
    const { avatar } = body;

    if (!avatar) {
      return c.json({ success: false, message: 'No image data provided' }, 400);
    }

    const authHeader = c.req.header('Authorization');
    let emailFromToken = '';
    let rollFromToken = '';
    let idFromToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], ENV.JWT_SECRET) as any;
        emailFromToken = decoded.email || '';
        rollFromToken = decoded.rollNumber || '';
        idFromToken = decoded.id || decoded._id || '';
      } catch {}
    }

    const st = ADMIN_STUDENTS.find((s) =>
      (idFromToken && (s.id === idFromToken || s._id === idFromToken)) ||
      (rollFromToken && s.rollNumber === rollFromToken) ||
      (emailFromToken && s.email === emailFromToken)
    );
    if (st) {
      st.avatar = avatar;
    }

    if (isMongoConnected() && (idFromToken || rollFromToken || emailFromToken)) {
      const matchConditions: any[] = [];
      if (idFromToken) matchConditions.push({ _id: idFromToken });
      if (rollFromToken) matchConditions.push({ rollNumber: rollFromToken });
      if (matchConditions.length === 0 && emailFromToken) matchConditions.push({ email: emailFromToken });

      await StudentModel.findOneAndUpdate(
        { $or: matchConditions },
        { avatar },
        { new: true }
      );
    }

    return c.json({
      success: true,
      message: 'Profile photo updated successfully!',
      avatarUrl: avatar,
      student: st || { avatar },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
