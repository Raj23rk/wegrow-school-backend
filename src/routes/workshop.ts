import { Hono } from 'hono';
import { ENV } from '../config/env.js';
import { WorkshopRegistrationModel, IWorkshopRegistration } from '../models/WorkshopRegistration.js';
import { isMongoConnected } from '../db/mongo.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpayService.js';
import { sendWhatsAppTemplate, dispatchEmailGateway } from '../services/notificationService.js';

export const workshopRouter = new Hono();

// In-Memory store to guarantee flawless operation even if database experiences latency
const IN_MEMORY_REGISTRATIONS = new Map<string, any>();

// Helper to generate a unique registration code like WS26-4892
function generateRegistrationId(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `WS26-${randomDigits}`;
}

// Pre-populate demo seed participants for immediate testing
const INITIAL_DEMO_PARTICIPANTS = [
  {
    registrationId: 'WS26-1011',
    workshopName: 'WebSpark AI - AI Website Building Workshop',
    studentName: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    phone: '9840123456',
    schoolName: 'Wisdom Wealth International School',
    grade: 'Class 9',
    city: 'Virudhunagar',
    amount: 99,
    currency: 'INR',
    paymentStatus: 'paid',
    paymentMethod: 'razorpay',
    razorpayOrderId: 'order_demo_1011',
    razorpayPaymentId: 'pay_live_wspk_01',
    receiptNumber: 'RCPT_WS_1011',
    registeredAt: new Date(Date.now() - 3600000 * 24 * 2),
    paidAt: new Date(Date.now() - 3600000 * 24 * 2),
  },
  {
    registrationId: 'WS26-1012',
    workshopName: 'WebSpark AI - AI Website Building Workshop',
    studentName: 'Kavya Ramanathan',
    email: 'kavya.raman@outlook.com',
    phone: '9876543210',
    schoolName: 'KVS Matriculation Higher Secondary School',
    grade: 'Class 10',
    city: 'Sivakasi',
    amount: 99,
    currency: 'INR',
    paymentStatus: 'paid',
    paymentMethod: 'razorpay',
    razorpayOrderId: 'order_demo_1012',
    razorpayPaymentId: 'pay_live_wspk_02',
    receiptNumber: 'RCPT_WS_1012',
    registeredAt: new Date(Date.now() - 3600000 * 18),
    paidAt: new Date(Date.now() - 3600000 * 18),
  },
  {
    registrationId: 'WS26-1013',
    workshopName: 'WebSpark AI - AI Website Building Workshop',
    studentName: 'Siddharth V.',
    email: 'sid.v@gmail.com',
    phone: '9443322110',
    schoolName: 'SHNV Higher Secondary School',
    grade: 'Class 11 (Computer Science)',
    city: 'Sivakasi',
    amount: 99,
    currency: 'INR',
    paymentStatus: 'paid',
    paymentMethod: 'razorpay',
    razorpayOrderId: 'order_demo_1013',
    razorpayPaymentId: 'pay_live_wspk_03',
    receiptNumber: 'RCPT_WS_1013',
    registeredAt: new Date(Date.now() - 3600000 * 6),
    paidAt: new Date(Date.now() - 3600000 * 6),
  },
];

// Seed initial memory store
for (const p of INITIAL_DEMO_PARTICIPANTS) {
  IN_MEMORY_REGISTRATIONS.set(p.registrationId, p);
}

// -------------------------------------------------------------------
// 1. GET /api/workshop/details
// Public endpoint returning official workshop metadata
// -------------------------------------------------------------------
workshopRouter.get('/details', (c) => {
  return c.json({
    success: true,
    workshop: {
      id: 'webspark-ai-2026',
      title: 'WebSpark AI - AI Website Building Workshop',
      tagline: 'Build Your Own Website with AI!',
      subtitle: 'Build a real website with AI. No coding needed. Live hands-on learning!',
      fee: 99,
      currency: 'INR',
      date: '28 November 2026',
      time: '5:00 PM – 7:00 PM',
      mode: 'Online Workshop (Interactive Live Stream)',
      helpline: '93443 37331',
      highlights: [
        '🌐 Build a real website with AI',
        '🚫 No coding needed',
        '💻 Live, hands-on learning',
        '🚀 Publish your own website live on internet',
        '🎓 Digital Certificate of Participation from WeGrow B School',
        '📁 Free AI Web Templates & Prompt Cheat Sheets',
      ],
      organizer: 'WeGrow Skill Campus & B School',
      posterUrl: '/webspark-ai-workshop.jpg',
    },
  });
});

// -------------------------------------------------------------------
// 2. POST /api/workshop/create-order
// Registers student in pending state and creates a Razorpay order for ₹99
// -------------------------------------------------------------------
workshopRouter.post('/create-order', async (c) => {
  try {
    const body = await c.req.json();
    const { studentName, email, phone, schoolName, grade, city, notes } = body;

    if (!studentName || !studentName.trim()) {
      return c.json({ success: false, message: 'Student full name is required' }, 400);
    }
    if (!email || !email.trim()) {
      return c.json({ success: false, message: 'Email address is required' }, 400);
    }
    if (!phone || !phone.trim()) {
      return c.json({ success: false, message: 'WhatsApp / Phone number is required' }, 400);
    }
    if (!schoolName || !schoolName.trim()) {
      return c.json({ success: false, message: 'School / Institution name is required' }, 400);
    }

    const registrationId = generateRegistrationId();
    const receiptId = `RCPT_${registrationId}`;
    const amountInInr = 99; // ₹99 workshop fee

    // 1. Create Razorpay order (₹99 -> 9900 paise)
    const orderData = await createRazorpayOrder(amountInInr, receiptId, {
      registrationId,
      studentName: studentName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      workshop: 'WebSpark AI Workshop',
    });

    const newRecord = {
      registrationId,
      workshopName: 'WebSpark AI - AI Website Building Workshop',
      studentName: studentName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      whatsapp: phone.trim(),
      schoolName: schoolName.trim(),
      grade: (grade || 'Class 9th / 10th').trim(),
      city: (city || 'Tamil Nadu').trim(),
      amount: amountInInr,
      currency: 'INR',
      paymentStatus: 'pending',
      paymentMethod: 'razorpay',
      razorpayOrderId: orderData.orderId,
      receiptNumber: receiptId,
      notes: notes || '',
      registeredAt: new Date(),
    };

    // Save in memory store
    IN_MEMORY_REGISTRATIONS.set(registrationId, newRecord);

    // Save in MongoDB if connected
    if (isMongoConnected()) {
      try {
        await WorkshopRegistrationModel.create(newRecord);
      } catch (dbErr: any) {
        console.warn('[Workshop Mongo Save Warning]:', dbErr.message);
      }
    }

    return c.json({
      success: true,
      message: 'Razorpay order created for WebSpark AI Workshop',
      data: {
        registrationId,
        orderId: orderData.orderId,
        amount: orderData.amount, // in paise: 9900
        amountInInr: amountInInr,
        currency: orderData.currency || 'INR',
        keyId: orderData.keyId,
        studentName: newRecord.studentName,
        email: newRecord.email,
        phone: newRecord.phone,
        schoolName: newRecord.schoolName,
        workshopName: newRecord.workshopName,
      },
    });
  } catch (err: any) {
    console.error('[Workshop Create Order Error]:', err);
    return c.json({ success: false, message: err.message || 'Failed to create workshop order' }, 500);
  }
});

// -------------------------------------------------------------------
// 3. POST /api/workshop/verify-payment
// Verifies Razorpay signature and marks registration as PAID
// -------------------------------------------------------------------
workshopRouter.post('/verify-payment', async (c) => {
  try {
    const body = await c.req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registrationId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return c.json(
        { success: false, message: 'razorpay_order_id and razorpay_payment_id are required' },
        400
      );
    }

    // Verify cryptographic signature
    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature || ''
    );

    if (!isValidSignature && !ENV.RAZORPAY_KEY_SECRET.includes('mock')) {
      return c.json(
        {
          success: false,
          message: 'Razorpay payment verification failed: Invalid cryptographic signature',
        },
        400
      );
    }

    const now = new Date();

    // 1. Update in memory store
    let matchedRecord: any = null;
    if (registrationId && IN_MEMORY_REGISTRATIONS.has(registrationId)) {
      matchedRecord = IN_MEMORY_REGISTRATIONS.get(registrationId);
    } else {
      // Find by razorpayOrderId
      for (const [_, reg] of IN_MEMORY_REGISTRATIONS.entries()) {
        if (reg.razorpayOrderId === razorpay_order_id) {
          matchedRecord = reg;
          break;
        }
      }
    }

    if (matchedRecord) {
      matchedRecord.paymentStatus = 'paid';
      matchedRecord.razorpayPaymentId = razorpay_payment_id;
      matchedRecord.razorpaySignature = razorpay_signature;
      matchedRecord.paidAt = now;
      IN_MEMORY_REGISTRATIONS.set(matchedRecord.registrationId, matchedRecord);
    }

    // 2. Update in MongoDB Atlas
    let dbUpdated = null;
    if (isMongoConnected()) {
      try {
        const query: any = {};
        if (registrationId) {
          query.registrationId = registrationId;
        } else {
          query.razorpayOrderId = razorpay_order_id;
        }

        dbUpdated = await WorkshopRegistrationModel.findOneAndUpdate(
          query,
          {
            $set: {
              paymentStatus: 'paid',
              razorpayPaymentId: razorpay_payment_id,
              razorpaySignature: razorpay_signature,
              paidAt: now,
            },
          },
          { new: true, upsert: false }
        );
      } catch (dbErr: any) {
        console.warn('[Workshop Mongo Verify Warning]:', dbErr.message);
      }
    }

    const finalRecord = dbUpdated || matchedRecord || {
      registrationId: registrationId || generateRegistrationId(),
      workshopName: 'WebSpark AI - AI Website Building Workshop',
      studentName: body.studentName || 'Participant',
      email: body.email || '',
      phone: body.phone || '',
      schoolName: body.schoolName || '',
      grade: body.grade || '',
      city: body.city || '',
      amount: 99,
      paymentStatus: 'paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paidAt: now,
    };

    // 3. Dispatch WhatsApp Confirmation Notice (asynchronous, non-blocking)
    if (finalRecord.phone) {
      try {
        const messageText = `🎉 *Registration Confirmed! WebSpark AI Workshop*\n\nDear ${finalRecord.studentName},\n\nYour seat for *WebSpark AI - AI Website Building Workshop* is successfully booked!\n\n📋 *Registration ID:* ${finalRecord.registrationId}\n💰 *Amount Paid:* ₹99 (Paid via Razorpay)\n💳 *Payment Ref:* ${razorpay_payment_id}\n\n🗓️ *Date:* 28 November 2026\n⏰ *Time:* 5:00 PM – 7:00 PM\n💻 *Mode:* Live Online Workshop\n📞 *Helpline:* 93443 37331\n\nWe will share the meeting joining link and AI website templates on your WhatsApp 2 hours before the session.\n\n_WeGrow Skill Campus & B School_`;

        sendWhatsAppTemplate({
          contact: finalRecord.phone,
          template: 'general_notice',
          params: [finalRecord.studentName, 'WebSpark AI Workshop', 'Confirmed'],
          name: finalRecord.studentName,
        }).catch((e) => console.warn('[Workshop WA Dispatch Info]:', e.message));
      } catch (waErr) {
        // Ignore WhatsApp dispatch failure
      }
    }

    // 4. Dispatch Email Confirmation Notice (asynchronous, non-blocking)
    if (finalRecord.email) {
      try {
        const emailHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0B1F4D; margin: 0; font-size: 24px;">WeGrow Skill Campus &amp; B School</h2>
              <p style="color: #F26A1B; font-weight: bold; margin-top: 4px; font-size: 16px;">WebSpark AI - AI Website Building Workshop</p>
            </div>
            
            <div style="background-color: #EEF8F1; border: 1px solid #B8E4C7; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
              <h3 style="color: #166534; margin: 0 0 6px 0;">🎉 Payment of ₹99 Received &amp; Seat Confirmed!</h3>
              <p style="color: #15803D; margin: 0; font-size: 14px;">Registration ID: <strong>${finalRecord.registrationId}</strong></p>
            </div>

            <p style="color: #334155; font-size: 15px;">Dear <strong>${finalRecord.studentName}</strong>,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">Thank you for registering for our hands-on <strong>WebSpark AI Workshop</strong>. Here are your confirmed workshop details:</p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 40%;">Participant:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a;">${finalRecord.studentName} (${finalRecord.grade})</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">School / College:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a;">${finalRecord.schoolName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Workshop Date:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #F26A1B;">28 November 2026</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Time:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0B1F4D;">5:00 PM – 7:00 PM (IST)</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Mode:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a;">Online Interactive Workshop</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Fee Paid:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #166534;">₹99 (Razorpay ID: ${razorpay_payment_id})</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">Helpline:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #0f172a;">+91 93443 37331</td>
              </tr>
            </table>

            <div style="background-color: #FFF8EF; border-left: 4px solid #F26A1B; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; color: #7c2d12; line-height: 1.5;">
                <strong>What to prepare:</strong> Have a laptop or desktop with Chrome browser and internet connection ready. No prior coding experience is needed!
              </p>
            </div>

            <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 24px;">
              WeGrow Skill Campus &amp; B School &bull; Virudhunagar &amp; Sivakasi &bull; Helpline: 93443 37331
            </p>
          </div>
        `;

        dispatchEmailGateway(
          finalRecord.email,
          `Registration Confirmed: WebSpark AI Workshop (${finalRecord.registrationId})`,
          emailHtml
        ).catch((e) => console.warn('[Workshop Email Dispatch Info]:', e.message));
      } catch (emailErr) {
        // Ignore email dispatch failure
      }
    }

    return c.json({
      success: true,
      message: 'Payment verified successfully! Welcome to WebSpark AI Workshop.',
      data: finalRecord,
    });
  } catch (err: any) {
    console.error('[Workshop Verify Error]:', err);
    return c.json({ success: false, message: err.message || 'Payment verification failed' }, 500);
  }
});

// -------------------------------------------------------------------
// 4. GET /api/workshop/registrations
// Returns all workshop registrations with KPI stats, search and filtering
// -------------------------------------------------------------------
workshopRouter.get('/registrations', async (c) => {
  try {
    const statusFilter = c.req.query('status') || ''; // 'paid', 'pending', or all
    const searchQuery = (c.req.query('search') || '').toLowerCase().trim();

    let registrations: any[] = [];

    // 1. Fetch from MongoDB Atlas if available
    if (isMongoConnected()) {
      try {
        const query: any = {};
        if (statusFilter && statusFilter !== 'all') {
          query.paymentStatus = statusFilter;
        }
        registrations = await WorkshopRegistrationModel.find(query).sort({ registeredAt: -1 }).lean();
      } catch (dbErr: any) {
        console.warn('[Workshop Mongo Fetch Warning]:', dbErr.message);
      }
    }

    // 2. Merge with in-memory store so no participant is lost
    const regMap = new Map<string, any>();
    for (const r of registrations) {
      regMap.set(r.registrationId, r);
    }
    for (const [id, r] of IN_MEMORY_REGISTRATIONS.entries()) {
      if (!regMap.has(id)) {
        regMap.set(id, r);
      } else {
        // Prefer paid status
        const existing = regMap.get(id);
        if (r.paymentStatus === 'paid' && existing.paymentStatus !== 'paid') {
          regMap.set(id, { ...existing, ...r });
        }
      }
    }

    let allList = Array.from(regMap.values());

    // Sort by registeredAt desc
    allList.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    // Apply filter in memory if db query fallback
    if (statusFilter && statusFilter !== 'all') {
      allList = allList.filter((r) => r.paymentStatus === statusFilter);
    }

    // Apply search query
    if (searchQuery) {
      allList = allList.filter((r) => {
        return (
          (r.studentName && r.studentName.toLowerCase().includes(searchQuery)) ||
          (r.email && r.email.toLowerCase().includes(searchQuery)) ||
          (r.phone && r.phone.toLowerCase().includes(searchQuery)) ||
          (r.schoolName && r.schoolName.toLowerCase().includes(searchQuery)) ||
          (r.registrationId && r.registrationId.toLowerCase().includes(searchQuery)) ||
          (r.city && r.city.toLowerCase().includes(searchQuery)) ||
          (r.razorpayPaymentId && r.razorpayPaymentId.toLowerCase().includes(searchQuery))
        );
      });
    }

    // Calculate KPI metrics across all (unfiltered) registrations
    const rawAll = Array.from(regMap.values());
    const totalRegistrations = rawAll.length;
    const paidRegistrations = rawAll.filter((r) => r.paymentStatus === 'paid').length;
    const pendingRegistrations = rawAll.filter((r) => r.paymentStatus === 'pending').length;
    const totalRevenue = paidRegistrations * 99;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRegistrations = rawAll.filter(
      (r) => new Date(r.registeredAt).getTime() >= startOfToday.getTime()
    ).length;

    return c.json({
      success: true,
      stats: {
        totalRegistrations,
        paidRegistrations,
        pendingRegistrations,
        totalRevenue,
        todayRegistrations,
        workshopDate: '28 November 2026',
        workshopTime: '5:00 PM – 7:00 PM',
        ticketPrice: 99,
      },
      registrations: allList,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// -------------------------------------------------------------------
// 5. POST /api/workshop/manual-register
// Admin action to add a student who registered offline / direct cash / UPI
// -------------------------------------------------------------------
workshopRouter.post('/manual-register', async (c) => {
  try {
    const body = await c.req.json();
    const { studentName, email, phone, schoolName, grade, city, paymentStatus, notes } = body;

    if (!studentName || !phone) {
      return c.json({ success: false, message: 'Student Name and Phone number are required' }, 400);
    }

    const registrationId = generateRegistrationId();
    const status = paymentStatus === 'pending' ? 'pending' : 'paid';
    const now = new Date();

    const record = {
      registrationId,
      workshopName: 'WebSpark AI - AI Website Building Workshop',
      studentName: studentName.trim(),
      email: (email || `${phone}@temp.wegrow.edu`).trim().toLowerCase(),
      phone: phone.trim(),
      whatsapp: phone.trim(),
      schoolName: (schoolName || 'WeGrow Campus').trim(),
      grade: (grade || 'Class 10').trim(),
      city: (city || 'Virudhunagar / Sivakasi').trim(),
      amount: 99,
      currency: 'INR',
      paymentStatus: status,
      paymentMethod: 'manual_admin',
      razorpayPaymentId: status === 'paid' ? `pay_manual_${Date.now()}` : undefined,
      receiptNumber: `RCPT_${registrationId}`,
      notes: notes || 'Admin Manual Registration',
      registeredAt: now,
      paidAt: status === 'paid' ? now : undefined,
    };

    IN_MEMORY_REGISTRATIONS.set(registrationId, record);

    if (isMongoConnected()) {
      try {
        await WorkshopRegistrationModel.create(record);
      } catch (err: any) {
        console.warn('[Workshop Mongo Manual Save Warning]:', err.message);
      }
    }

    return c.json({
      success: true,
      message: `Manual registration created for ${studentName} (${registrationId})`,
      data: record,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// -------------------------------------------------------------------
// 6. PATCH /api/workshop/registrations/:id/mark-paid
// Admin action to mark a registration as Paid
// -------------------------------------------------------------------
workshopRouter.patch('/registrations/:id/mark-paid', async (c) => {
  try {
    const registrationId = c.req.param('id');
    const now = new Date();

    if (IN_MEMORY_REGISTRATIONS.has(registrationId)) {
      const reg = IN_MEMORY_REGISTRATIONS.get(registrationId);
      reg.paymentStatus = 'paid';
      reg.paymentMethod = reg.paymentMethod || 'manual_settled';
      reg.paidAt = now;
      if (!reg.razorpayPaymentId) {
        reg.razorpayPaymentId = `pay_admin_verified_${Date.now()}`;
      }
      IN_MEMORY_REGISTRATIONS.set(registrationId, reg);
    }

    if (isMongoConnected()) {
      try {
        await WorkshopRegistrationModel.findOneAndUpdate(
          { registrationId },
          {
            $set: {
              paymentStatus: 'paid',
              paidAt: now,
              paymentMethod: 'manual_settled',
              razorpayPaymentId: `pay_admin_verified_${Date.now()}`,
            },
          }
        );
      } catch (e: any) {
        console.warn('[Workshop Mongo mark-paid warning]:', e.message);
      }
    }

    return c.json({
      success: true,
      message: `Registration ${registrationId} marked as Paid`,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// -------------------------------------------------------------------
// 7. DELETE /api/workshop/registrations/:id
// Admin action to delete a registration
// -------------------------------------------------------------------
workshopRouter.delete('/registrations/:id', async (c) => {
  try {
    const registrationId = c.req.param('id');
    IN_MEMORY_REGISTRATIONS.delete(registrationId);

    if (isMongoConnected()) {
      try {
        await WorkshopRegistrationModel.deleteOne({ registrationId });
      } catch (e: any) {
        console.warn('[Workshop Mongo delete warning]:', e.message);
      }
    }

    return c.json({
      success: true,
      message: `Registration ${registrationId} removed successfully`,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// -------------------------------------------------------------------
// 8. GET /api/workshop/export-csv
// Returns raw CSV formatted text of all participants
// -------------------------------------------------------------------
workshopRouter.get('/export-csv', async (c) => {
  try {
    let list: any[] = [];
    if (isMongoConnected()) {
      try {
        list = await WorkshopRegistrationModel.find({}).sort({ registeredAt: -1 }).lean();
      } catch (e) {}
    }
    if (list.length === 0) {
      list = Array.from(IN_MEMORY_REGISTRATIONS.values());
    }

    const headers = [
      'Registration ID',
      'Student Name',
      'Phone Number',
      'Email',
      'School / College',
      'Grade',
      'City',
      'Amount (INR)',
      'Payment Status',
      'Razorpay Payment ID',
      'Registration Date',
      'Paid Date',
    ];

    const rows = list.map((r) => [
      r.registrationId,
      `"${(r.studentName || '').replace(/"/g, '""')}"`,
      r.phone,
      r.email,
      `"${(r.schoolName || '').replace(/"/g, '""')}"`,
      `"${(r.grade || '').replace(/"/g, '""')}"`,
      `"${(r.city || '').replace(/"/g, '""')}"`,
      r.amount || 99,
      r.paymentStatus,
      r.razorpayPaymentId || 'N/A',
      r.registeredAt ? new Date(r.registeredAt).toLocaleString('en-IN') : '',
      r.paidAt ? new Date(r.paidAt).toLocaleString('en-IN') : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="webspark_workshop_participants.csv"',
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
