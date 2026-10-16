import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { SEED_DATA } from '../data/seedData.js';
import { PaymentModel } from '../models/Payment.js';
import { StudentModel } from '../models/Student.js';
import { isMongoConnected } from '../db/mongo.js';
import { ADMIN_STUDENTS } from './admin.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpayService.js';
import {
  getAllFeePlans,
  normalizeFeePlanKey,
  resolveStudentFeeDetails,
  calculateInstallments,
  getNextDueInstallment,
  FEE_PLANS,
} from '../services/feeService.js';

export const paymentsRouter = new Hono();

// Helper to look up student from request (JWT bearer token or query param)
async function getStudentFromRequest(c: any): Promise<any> {
  const authHeader = c.req.header('Authorization');
  let studentId = c.req.query('studentId') || '';
  let email = '';
  let roll = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      studentId = decoded.id || decoded._id || studentId;
      email = (decoded.email || '').toLowerCase().trim();
      roll = (decoded.rollNumber || '').toLowerCase().trim();
    } catch (e) {}
  }

  // 1. Search in active ADMIN_STUDENTS roster
  let student = ADMIN_STUDENTS.find((s) => {
    const sId = (s.id || s._id || '').toString();
    const sEmail = (s.email || '').toLowerCase().trim();
    const sRoll = (s.rollNumber || '').toLowerCase().trim();
    return (
      (studentId && sId === studentId) ||
      (email && sEmail === email) ||
      (roll && sRoll === roll)
    );
  });

  // 2. Search in MongoDB if connected
  if (!student && isMongoConnected()) {
    try {
      const conditions: any[] = [];
      if (studentId) {
        conditions.push({ _id: studentId });
        conditions.push({ id: studentId });
      }
      if (email) conditions.push({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      if (roll) conditions.push({ rollNumber: { $regex: new RegExp(`^${roll}$`, 'i') } });

      if (conditions.length > 0) {
        student = await StudentModel.findOne({ $or: conditions });
      }
    } catch (err: any) {
      console.warn('Payment Mongo student query warning:', err.message);
    }
  }

  // 3. Fallback to SEED_DATA.student
  if (!student) {
    student = SEED_DATA.student;
  }

  return student;
}

// Get all Fee Payment Plans (1. Full Payment ₹43,000, 2. Half Payment ₹45,000 split ₹22,500 x 2, 3. Term Payment ₹45,000 / 3 = ₹15,000)
paymentsRouter.get('/plans', (c) => {
  return c.json({
    success: true,
    data: getAllFeePlans(),
  });
});

// Get fee overview & transaction history for the authenticated student
paymentsRouter.get('/history', async (c) => {
  const student = await getStudentFromRequest(c);
  if (!student) {
    return c.json({
      success: true,
      data: {
        totalFees: 0,
        paidFees: 0,
        dueFees: 0,
        payments: [],
      },
    });
  }

  const sId = (student.id || student._id || '').toString();
  const feeDetails = resolveStudentFeeDetails({
    feeType: student.feeType || student.feePaymentPlan,
    customTotalFees: student.totalFees,
    paidFees: student.paidFees || 0,
  });

  const totalFees = feeDetails.totalFees;
  const paidFees = feeDetails.paidFees;
  const dueFees = feeDetails.dueFees;
  const installments = (student.installments && student.installments.length > 0)
    ? student.installments
    : feeDetails.installments;
  const nextDueInstallment = getNextDueInstallment(installments);

  // Fetch payments for this student
  let payments: any[] = [];

  // Check MongoDB
  if (isMongoConnected() && sId) {
    try {
      payments = await PaymentModel.find({
        $or: [
          { studentId: sId },
          { studentName: student.name },
          { studentId: student.rollNumber },
        ],
      }).sort({ date: -1 });
    } catch (err: any) {
      console.warn('Mongo payments query warning:', err.message);
    }
  }

  // Check in-memory SEED_DATA.payments
  if (!payments || payments.length === 0) {
    payments = (SEED_DATA.payments || []).filter(
      (p) =>
        p.studentId === sId ||
        p.studentName === student.name ||
        p.studentId === student.rollNumber
    );
  }

  // If student has paid fees but no individual transaction record exists, create the receipt
  if (paidFees > 0 && payments.length === 0) {
    const defaultReceipt = {
      _id: `pay_${sId || 'init'}`,
      studentId: sId,
      studentName: student.name,
      receiptNumber: `RCPT-2026-${sId.slice(-4) || '1001'}`,
      amount: paidFees,
      currency: 'INR',
      feeType: 'Initial Admission & Tuition Fee',
      status: 'paid',
      method: 'Online UPI / Student Portal',
      date: student.createdAt || new Date().toISOString(),
    };
    payments = [defaultReceipt];
  }

  return c.json({
    success: true,
    data: {
      studentId: sId,
      studentName: student.name,
      feeType: student.feeType || feeDetails.feeType,
      feePaymentPlan: student.feePaymentPlan || feeDetails.feePaymentPlan,
      feePlanLabel: student.feePlanLabel || feeDetails.feePlanLabel,
      installmentCount: student.installmentCount || feeDetails.installmentCount,
      installmentAmount: student.installmentAmount || feeDetails.installmentAmount,
      totalFees,
      paidFees,
      dueFees,
      installments,
      nextDueInstallment,
      payments,
    },
  });
});

// Create Razorpay Order
paymentsRouter.post('/create-order', async (c) => {
  try {
    const body = await c.req.json();
    const student = (await getStudentFromRequest(c)) || {
      _id: 'std_temp',
      name: 'Student',
      email: 'student@wegrow.edu',
      phone: '+91 98765 43210',
      totalFees: 45000,
      paidFees: 0,
      dueFees: 45000,
      feeType: 'term',
      installmentAmount: 15000,
    };

    const studentInstallments = calculateInstallments(
      student.feeType || 'term',
      student.totalFees || 45000,
      student.paidFees || 0
    );
    const nextDue = getNextDueInstallment(studentInstallments);

    const defaultAmount = nextDue ? nextDue.amountDue : (student.installmentAmount || student.dueFees || 15000);
    const defaultFeeType = nextDue ? nextDue.title : (body.feeType || 'Term Tuition & Lab Fee');

    const paymentAmount = Number(body.amount) || defaultAmount;
    const feeType = body.feeType || defaultFeeType;
    const receiptId = `RCPT_${Date.now()}`;

    const orderData = await createRazorpayOrder(paymentAmount, receiptId, {
      studentId: student._id || student.id,
      studentName: student.name,
      feeType,
    });

    return c.json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        orderId: orderData.orderId,
        amount: orderData.amount, // in paise
        amountInInr: paymentAmount,
        currency: orderData.currency,
        keyId: orderData.keyId,
        studentName: student.name,
        studentEmail: student.email,
        studentPhone: student.phone || student.fatherPhone || '+91 98765 43210',
        feeType,
        nextDueInstallment: nextDue,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Verify Payment Signature
paymentsRouter.post('/verify', async (c) => {
  try {
    const body = await c.req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amountInInr,
      feeType,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return c.json(
        { success: false, message: 'Missing payment verification parameters' },
        400
      );
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!isValid) {
      return c.json(
        { success: false, message: 'Razorpay payment signature verification failed' },
        400
      );
    }

    const amountPaid = Number(amountInInr) || 15000;
    const receiptNum = `RCPT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const student = await getStudentFromRequest(c);
    const sId = student?.id || student?._id || 'std_temp';
    const sName = student?.name || 'Student';

    const newPaymentRecord: any = {
      _id: `pay_${Date.now().toString(36)}`,
      studentId: sId,
      studentName: sName,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: amountPaid,
      currency: 'INR',
      feeType: feeType || 'Tuition Fee Payment',
      status: 'paid',
      receiptNumber: receiptNum,
      date: new Date(),
    };

    SEED_DATA.payments.unshift(newPaymentRecord);

    let updatedPaid = amountPaid;
    let updatedDue = 0;
    let updatedInstallments: any[] = [];
    let nextDue: any = null;

    if (student) {
      student.paidFees = (student.paidFees || 0) + amountPaid;
      student.dueFees = Math.max(
        0,
        (student.totalFees || 45000) - student.paidFees
      );
      student.installments = calculateInstallments(
        student.feeType || 'term',
        student.totalFees || 45000,
        student.paidFees
      );
      updatedPaid = student.paidFees;
      updatedDue = student.dueFees;
      updatedInstallments = student.installments;
      nextDue = getNextDueInstallment(updatedInstallments);

      if (isMongoConnected()) {
        try {
          await PaymentModel.create(newPaymentRecord);
          await StudentModel.findOneAndUpdate(
            { $or: [{ _id: sId }, { email: student.email }] },
            {
              paidFees: student.paidFees,
              dueFees: student.dueFees,
              installments: student.installments,
            }
          );
        } catch (err: any) {
          console.warn('Payment Mongo record warning:', err.message);
        }
      }
    }

    return c.json({
      success: true,
      message: 'Fee payment verified and processed successfully!',
      data: {
        receiptNumber: receiptNum,
        amount: amountPaid,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        paidFees: updatedPaid,
        dueFees: updatedDue,
        installments: updatedInstallments,
        nextDueInstallment: nextDue,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});
