import { Hono } from 'hono';
import { SEED_DATA } from '../data/seedData.js';
import { PaymentModel } from '../models/Payment.js';
import { StudentModel } from '../models/Student.js';
import { isMongoConnected } from '../db/mongo.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpayService.js';

export const paymentsRouter = new Hono();

// Get fee overview & transaction history
paymentsRouter.get('/history', (c) => {
  const student = SEED_DATA.student || { totalFees: 0, paidFees: 0, dueFees: 0 };
  return c.json({
    success: true,
    data: {
      totalFees: student.totalFees || 0,
      paidFees: student.paidFees || 0,
      dueFees: student.dueFees || 0,
      payments: SEED_DATA.payments,
    },
  });
});

// Create Razorpay Order
paymentsRouter.post('/create-order', async (c) => {
  try {
    const body = await c.req.json();
    const { amount, feeType = 'Term 2 Tuition & Lab Fee' } = body;

    const student = SEED_DATA.student || {
      _id: 'std_temp',
      name: 'Student',
      email: 'student@wegrow.edu',
      phone: '+91 98765 43210',
      dueFees: 0,
    };

    const paymentAmount = Number(amount) || student.dueFees || 15000;
    const receiptId = `RCPT_${Date.now()}`;

    const orderData = await createRazorpayOrder(paymentAmount, receiptId, {
      studentId: student._id,
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
        studentPhone: student.phone,
        feeType,
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amountInInr, feeType } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return c.json({ success: false, message: 'Missing payment verification parameters' }, 400);
    }

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return c.json({ success: false, message: 'Razorpay payment signature verification failed' }, 400);
    }

    const amountPaid = Number(amountInInr) || 15000;
    const receiptNum = `RCPT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const student = SEED_DATA.student || {
      _id: 'std_temp',
      name: 'Student',
      email: 'student@wegrow.edu',
      paidFees: 0,
      totalFees: 45000,
      dueFees: 45000,
    };

    const newPaymentRecord: any = {
      _id: `pay_${Date.now().toString(36)}`,
      studentId: student._id,
      studentName: student.name,
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
    if (SEED_DATA.student) {
      SEED_DATA.student.paidFees += amountPaid;
      SEED_DATA.student.dueFees = Math.max(0, SEED_DATA.student.totalFees - SEED_DATA.student.paidFees);
    }

    if (isMongoConnected() && SEED_DATA.student) {
      try {
        await PaymentModel.create(newPaymentRecord);
        await StudentModel.findOneAndUpdate(
          { email: SEED_DATA.student.email },
          { paidFees: SEED_DATA.student.paidFees, dueFees: SEED_DATA.student.dueFees }
        );
      } catch (err: any) {
        console.warn('Payment Mongo record warning:', err.message);
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
        paidFees: SEED_DATA.student?.paidFees || amountPaid,
        dueFees: SEED_DATA.student?.dueFees || 0,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});
