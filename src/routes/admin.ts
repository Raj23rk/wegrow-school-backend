import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { SEED_DATA } from '../data/seedData.js';
import { ENV } from '../config/env.js';
import { StudentModel } from '../models/Student.js';
import { AttendanceModel } from '../models/Attendance.js';
import { isMongoConnected } from '../db/mongo.js';
import {
  sendDirectWhatsAppMessage,
  sendDirectEmailMessage,
} from '../services/notificationService.js';

export const adminRouter = new Hono();

// Active Institutional Student Roster (Kept synchronized with MongoDB)
export const ADMIN_STUDENTS: any[] = [];

// Helper to get active students from MongoDB or in-memory fallback
export async function getActiveStudents(): Promise<any[]> {
  if (isMongoConnected()) {
    try {
      const dbStudents = await StudentModel.find().sort({ createdAt: -1 });
      if (dbStudents && dbStudents.length > 0) {
        const mapped = dbStudents.map((s) => ({
          id: s._id.toString(),
          _id: s._id.toString(),
          name: s.name,
          email: s.email,
          rollNumber: s.rollNumber,
          grade: s.grade,
          section: s.section || 'A',
          batch: s.batch || 'Cohort Alpha (12-Month Diploma)',
          schoolName: s.schoolName || 'WeGrow Skill Campus Partner School',
          parentName: s.parentName,
          fatherName: s.fatherName || '',
          motherName: s.motherName || '',
          fatherPhone: s.fatherPhone || '',
          motherPhone: s.motherPhone || '',
          parentEmail: s.parentEmail,
          parentWhatsApp: s.parentWhatsApp,
          totalFees: s.totalFees || 45000,
          paidFees: s.paidFees || 0,
          dueFees: s.dueFees !== undefined ? s.dueFees : Math.max(0, (s.totalFees || 45000) - (s.paidFees || 0)),
          attendanceRate: 100,
          status: 'active',
          createdAt: s.createdAt,
        }));

        ADMIN_STUDENTS.length = 0;
        ADMIN_STUDENTS.push(...mapped);
        return mapped;
      }
    } catch (err: any) {
      console.warn('getActiveStudents MongoDB fetch fallback:', err.message);
    }
  }
  return ADMIN_STUDENTS;
}

// Sequential Enrollment ID Generator starting with WG26-001
export async function generateNextEnrollmentNumber(): Promise<string> {
  const students = await getActiveStudents();
  const existingNumbers: number[] = [];

  for (const s of students) {
    if (s.rollNumber) {
      const match = String(s.rollNumber).match(/WG26-(\d+)/i);
      if (match) {
        existingNumbers.push(parseInt(match[1], 10));
      }
    }
  }

  if (existingNumbers.length === 0) {
    return 'WG26-001';
  }

  const maxNum = Math.max(...existingNumbers);
  const nextNum = maxNum + 1;
  return `WG26-${String(nextNum).padStart(3, '0')}`;
}

// In-memory batch attendance registry
const BATCH_ATTENDANCE_STORE: Record<string, any[]> = {};

// In-memory Notification Templates Store
let NOTIFICATION_TEMPLATES: any[] = [
  {
    id: 'tmpl_01',
    title: 'Daily Attendance Absence Alert',
    category: 'attendance',
    channel: 'both',
    subject: 'Urgent: Student Attendance Alert - WeGrow Sivakasi Campus',
    templateBody: `Dear {parentName},\n\nThis is an official notice that your ward {studentName} ({className}) from {schoolName} was marked ABSENT today ({date}) without prior approved leave.\n\nPlease verify and contact campus security/helpdesk if this is an error.\n\nRegards,\nWeGrow Campus Administration`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_02',
    title: 'Tuition Fee Due & Razorpay Settlement Link',
    category: 'finance',
    channel: 'both',
    subject: 'Tuition Fee Settlement Reminder - WeGrow Skill Campus',
    templateBody: `Dear {parentName},\n\nGentle reminder: The academic term fee for {studentName} ({className}) has a pending balance of INR {dueFees}.\n\nPlease complete online settlement via Razorpay UPI in the Student Portal:\nhttps://wegrowskillcampus.edu/portal\n\nThank you for supporting your child's tech education!\nWeGrow Finance Office`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_03',
    title: 'Academic Achievement & Diagnostic Test Release',
    category: 'academic',
    channel: 'both',
    subject: 'Academic Milestone: Diagnostic Evaluation Scores Released',
    templateBody: `Dear {parentName},\n\nWe are pleased to inform you that recent hands-on AI & Robotics evaluation results for {studentName} are now published.\n\nYour ward scored commendably in the latest practical lab assessment. Full scorecard & instructor feedback are accessible on the portal.\n\nWarm regards,\nAcademic Director, WeGrow Sivakasi`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_04',
    title: 'Parent-Teacher Meeting (PTM) Invitation',
    category: 'general',
    channel: 'both',
    subject: 'Invitation: Parent-Teacher Interactive Conclave',
    templateBody: `Dear Mr. {fatherName} & Mrs. {motherName},\n\nYou are cordially invited to our Upcoming Term Conclave on Saturday to review {studentName}'s coding and robotics project progress.\n\nVenue: WeGrow Skill Campus Lab, Sivakasi.\nTime slots available on the student portal.\n\nWe look forward to meeting you!`,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_05',
    title: 'Special Holiday & Lab Schedule Update',
    category: 'general',
    channel: 'whatsapp',
    subject: 'Campus Schedule & Lab Timings Circular',
    templateBody: `Notice to Parents:\nCampus practical robotics lab sessions for {studentName} ({className}) will follow the festive weekend schedule on {date}.\n\nOnline doubt clearance will remain active 24/7 on the student portal.`,
    createdAt: new Date().toISOString(),
  },
];

// Helper to replace placeholders
function interpolateTemplate(template: string, student: any): string {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return template
    .replace(/{studentName}/g, student.name || 'Student')
    .replace(/{parentName}/g, student.parentName || student.fatherName || 'Parent')
    .replace(/{fatherName}/g, student.fatherName || student.parentName || 'Father')
    .replace(/{motherName}/g, student.motherName || 'Mother')
    .replace(/{className}/g, student.grade || student.batch || 'Program')
    .replace(/{batch}/g, student.batch || 'Cohort')
    .replace(/{schoolName}/g, student.schoolName || 'WeGrow Partner School')
    .replace(/{rollNumber}/g, student.rollNumber || '')
    .replace(/{dueFees}/g, (student.dueFees || 0).toLocaleString('en-IN'))
    .replace(/{date}/g, today);
}

// 1. Admin System Overview
adminRouter.get('/overview', async (c) => {
  const students = await getActiveStudents();
  const totalStudents = students.length;
  const totalFeesExpected = students.reduce((acc, s) => acc + (s.totalFees || 0), 0);
  const totalCollected = students.reduce((acc, s) => acc + (s.paidFees || 0), 0);
  const totalOutstanding = students.reduce((acc, s) => acc + (s.dueFees || 0), 0);
  const avgAttendance = totalStudents > 0
    ? Math.round(students.reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / totalStudents)
    : 100;

  return c.json({
    success: true,
    data: {
      totalStudents,
      totalFeesExpected,
      totalCollected,
      totalOutstanding,
      avgAttendance,
      batches: [
        'Cohort Alpha (12-Month Diploma)',
        'Cohort Beta (AI & Robotics)',
        'Cohort Gamma (Young Coders Weekend)',
      ],
      totalAssignments: SEED_DATA.assignments.length,
      totalNotes: SEED_DATA.courseMaterials.length,
      totalVideos: SEED_DATA.videos.length,
      totalTemplates: NOTIFICATION_TEMPLATES.length,
    },
  });
});

// 2. Get Students by Batch (or all)
adminRouter.get('/students', async (c) => {
  const batchQuery = c.req.query('batch');
  const students = await getActiveStudents();
  let filtered = students;
  if (batchQuery && batchQuery !== 'All') {
    filtered = students.filter(
      (s) => (s.batch || '').toLowerCase() === batchQuery.toLowerCase()
    );
  }

  return c.json({
    success: true,
    data: filtered,
  });
});

// 3. Get Next Auto-Generated Sequential Enrollment ID & Default Password
adminRouter.get('/next-enrollment', async (c) => {
  const nextRollNumber = await generateNextEnrollmentNumber();
  const defaultPassword = `${nextRollNumber}@2026`;
  return c.json({
    success: true,
    nextRollNumber,
    defaultPassword,
  });
});

// Reset Roster to Empty (starts next enrollment at WG26-001)
adminRouter.post('/reset-students', async (c) => {
  ADMIN_STUDENTS.length = 0;
  if (isMongoConnected()) {
    try {
      await StudentModel.deleteMany({});
    } catch (err: any) {
      console.warn('StudentModel deleteMany warning:', err.message);
    }
  }
  return c.json({
    success: true,
    message: 'Institutional student roster cleared. Next enrollment will start with WG26-001.',
    nextRollNumber: 'WG26-001',
    defaultPassword: 'WG26-001@2026',
  });
});

// Clean Roster Helper (Starts clean with WG26-001)
adminRouter.post('/load-sample-students', (c) => {
  ADMIN_STUDENTS.length = 0;
  return c.json({
    success: true,
    message: 'Institutional roster ready. Next enrollment will start with WG26-001.',
    count: 0,
    nextRollNumber: 'WG26-001',
    defaultPassword: 'WG26-001@2026',
  });
});

// 4. Create New Student Enrollment by Admin
adminRouter.post('/students', async (c) => {
  try {
    const body = await c.req.json();
    const {
      name,
      grade,
      schoolName,
      fatherName,
      motherName,
      fatherPhone,
      motherPhone,
      email,
      batch = 'Cohort Alpha (12-Month Diploma)',
      totalFees = 45000,
      paidFees = 0,
      rollNumber: customRoll,
      password: customPassword,
    } = body;

    if (!name || !name.trim()) {
      return c.json({ success: false, message: 'Student Name is required' }, 400);
    }
    if (!email || !email.trim()) {
      return c.json({ success: false, message: 'Gmail / Email address is required' }, 400);
    }
    if (!fatherPhone && !motherPhone) {
      return c.json({ success: false, message: 'At least one parent phone number is required' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (fatherPhone || motherPhone || '').trim();

    // Check duplicate email
    const allExisting = await getActiveStudents();
    const existing = allExisting.find(
      (s) => s.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      return c.json(
        { success: false, message: `Student with email ${cleanEmail} already exists!` },
        400
      );
    }

    // Determine Enrollment ID: starts with WG26-001 automatically
    const rollNumber = (customRoll && typeof customRoll === 'string' && customRoll.trim())
      ? customRoll.trim().toUpperCase()
      : await generateNextEnrollmentNumber();

    // Determine Password created with Admin (defaults to [RollNumber]@2026)
    const finalPassword = (customPassword && typeof customPassword === 'string' && customPassword.trim())
      ? customPassword.trim()
      : `${rollNumber}@2026`;

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(finalPassword, salt);

    const newId = `std_${Date.now().toString(36)}`;
    const parentName = (fatherName || motherName || 'Parent').trim();
    const parsedTotalFees = Number(totalFees) || 45000;
    const parsedPaidFees = Number(paidFees) || 0;
    const dueFees = Math.max(0, parsedTotalFees - parsedPaidFees);

    const newStudent: any = {
      id: newId,
      _id: newId,
      name: name.trim(),
      email: cleanEmail,
      rollNumber,
      password: finalPassword,
      passwordHash,
      grade: grade || 'AI & GenAI Master Track',
      batch,
      schoolName: schoolName ? schoolName.trim() : 'WeGrow Skill Campus Partner School',
      fatherName: fatherName ? fatherName.trim() : '',
      motherName: motherName ? motherName.trim() : '',
      fatherPhone: fatherPhone ? fatherPhone.trim() : '',
      motherPhone: motherPhone ? motherPhone.trim() : '',
      parentName,
      parentEmail: cleanEmail,
      parentWhatsApp: cleanPhone,
      totalFees: parsedTotalFees,
      paidFees: parsedPaidFees,
      dueFees,
      attendanceRate: 100,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Add to in-memory roster (most recent first)
    ADMIN_STUDENTS.unshift(newStudent);

    // If MongoDB connected, persist to Database
    if (isMongoConnected()) {
      try {
        await StudentModel.create({
          name: newStudent.name,
          email: newStudent.email,
          passwordHash,
          rollNumber: newStudent.rollNumber,
          grade: newStudent.grade,
          section: 'A',
          batch: newStudent.batch,
          schoolName: newStudent.schoolName,
          parentName: newStudent.parentName,
          fatherName: newStudent.fatherName,
          motherName: newStudent.motherName,
          fatherPhone: newStudent.fatherPhone,
          motherPhone: newStudent.motherPhone,
          parentEmail: newStudent.parentEmail,
          parentWhatsApp: newStudent.parentWhatsApp,
          totalFees: newStudent.totalFees,
          paidFees: newStudent.paidFees,
          dueFees: newStudent.dueFees,
        });
      } catch (dbErr: any) {
        console.warn('MongoDB student save warning:', dbErr.message);
      }
    }

    return c.json({
      success: true,
      message: `Student ${newStudent.name} enrolled successfully! Assigned Roll No: ${rollNumber} | Password: ${finalPassword}`,
      student: newStudent,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message || 'Failed to create student' }, 500);
  }
});

// 4. Delete Student
adminRouter.delete('/students/:id', async (c) => {
  const id = c.req.param('id');
  const index = ADMIN_STUDENTS.findIndex((s) => s.id === id || s._id === id);
  if (index === -1) {
    return c.json({ success: false, message: 'Student not found' }, 404);
  }

  const removed = ADMIN_STUDENTS.splice(index, 1)[0];

  if (isMongoConnected()) {
    try {
      await StudentModel.findOneAndDelete({
        $or: [{ _id: id }, { rollNumber: removed.rollNumber }, { email: removed.email }],
      });
    } catch (e) {
      // ignore
    }
  }

  return c.json({
    success: true,
    message: `Student ${removed.name} removed from roster successfully!`,
  });
});

// 5. Single Student Direct Notification (WhatsApp / Email)
adminRouter.post('/students/:id/notify', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { channel = 'both', messageType = 'custom', customMessage, subject } = body;

    const student = ADMIN_STUDENTS.find((s) => s.id === id || s._id === id);
    if (!student) {
      return c.json({ success: false, message: 'Student not found' }, 404);
    }

    const textToSend =
      customMessage ||
      `Notice regarding ${student.name} (${student.grade}) at ${student.schoolName}. Please check the student portal for latest attendance and notes.`;

    const results: any = {};

    // 1. WhatsApp Dispatch (to Father Phone or Mother Phone)
    if (channel === 'whatsapp' || channel === 'both') {
      const targetPhone =
        student.fatherPhone || student.parentWhatsApp || student.motherPhone;
      if (targetPhone) {
        const waRes = await sendDirectWhatsAppMessage({
          phone: targetPhone,
          recipientName: student.parentName || student.fatherName || 'Parent',
          studentName: student.name,
          messageText: `📢 *WeGrow Skill Campus Notice*\nDear *${student.parentName}* (Parent of *${student.name}*):\n\n${textToSend}\n\nSchool: ${student.schoolName}\nRoll No: ${student.rollNumber}`,
        });
        results.whatsapp = waRes;
      }
    }

    // 2. Email Dispatch
    if (channel === 'email' || channel === 'both') {
      const targetEmail = student.parentEmail || student.email;
      if (targetEmail) {
        const emailRes = await sendDirectEmailMessage({
          toEmail: targetEmail,
          subject: subject || `Academic Notice regarding ${student.name} - WeGrow Campus`,
          recipientName: student.parentName || student.fatherName || 'Parent',
          studentName: student.name,
          bodyText: textToSend,
        });
        results.email = emailRes;
      }
    }

    return c.json({
      success: true,
      message: `Notification dispatched for ${student.name} via ${channel.toUpperCase()}!`,
      results,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 6. Notification Templates CRUD
adminRouter.get('/notification-templates', (c) => {
  return c.json({
    success: true,
    data: NOTIFICATION_TEMPLATES,
  });
});

adminRouter.post('/notification-templates', async (c) => {
  try {
    const body = await c.req.json();
    const { title, category = 'general', channel = 'both', subject = '', templateBody } = body;

    if (!title || !templateBody) {
      return c.json(
        { success: false, message: 'Template Title and Content are required' },
        400
      );
    }

    const newTemplate = {
      id: `tmpl_${Date.now().toString(36)}`,
      title: title.trim(),
      category,
      channel,
      subject: subject.trim() || title.trim(),
      templateBody: templateBody.trim(),
      createdAt: new Date().toISOString(),
    };

    NOTIFICATION_TEMPLATES.unshift(newTemplate);

    return c.json({
      success: true,
      message: `Template "${newTemplate.title}" created successfully!`,
      data: newTemplate,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

adminRouter.delete('/notification-templates/:id', (c) => {
  const id = c.req.param('id');
  const initialLen = NOTIFICATION_TEMPLATES.length;
  NOTIFICATION_TEMPLATES = NOTIFICATION_TEMPLATES.filter((t) => t.id !== id);

  if (NOTIFICATION_TEMPLATES.length === initialLen) {
    return c.json({ success: false, message: 'Template not found' }, 404);
  }

  return c.json({
    success: true,
    message: 'Template deleted successfully!',
  });
});

// 7. Bulk Message Broadcast (WhatsApp API & Email API)
adminRouter.post('/broadcast-notification', async (c) => {
  try {
    const body = await c.req.json();
    const {
      channel = 'both',
      targetBatch = 'All',
      templateId,
      customSubject,
      customMessage,
    } = body;

    let recipients: any[] = [];
    if (targetBatch && targetBatch !== 'All') {
      recipients = ADMIN_STUDENTS.filter(
        (st) => (st.batch || '').toLowerCase() === targetBatch.toLowerCase()
      );
    } else {
      recipients = ADMIN_STUDENTS;
    }

    if (recipients.length === 0) {
      return c.json({ success: false, message: 'No students found in target batch' }, 400);
    }

    // Determine message template
    let templateText = customMessage || '';
    let emailSubject = customSubject || 'Official Circular - WeGrow Skill Campus';

    if (templateId) {
      const foundTemplate = NOTIFICATION_TEMPLATES.find((t) => t.id === templateId);
      if (foundTemplate) {
        templateText = foundTemplate.templateBody;
        emailSubject = foundTemplate.subject || foundTemplate.title;
      }
    }

    if (!templateText.trim()) {
      return c.json(
        { success: false, message: 'Message content or template is required' },
        400
      );
    }

    const dispatchedLog: any[] = [];

    for (const student of recipients) {
      const personalizedMsg = interpolateTemplate(templateText, student);
      const studentLog: any = {
        studentName: student.name,
        rollNumber: student.rollNumber,
        schoolName: student.schoolName,
        fatherName: student.fatherName,
        motherName: student.motherName,
        whatsappStatus: 'Skipped',
        emailStatus: 'Skipped',
        time: new Date().toLocaleTimeString('en-IN'),
      };

      // 1. WhatsApp Dispatch
      if (channel === 'whatsapp' || channel === 'both') {
        const phone = student.fatherPhone || student.parentWhatsApp || student.motherPhone;
        if (phone) {
          const waRes = await sendDirectWhatsAppMessage({
            phone,
            recipientName: student.parentName || student.fatherName || 'Parent',
            studentName: student.name,
            messageText: personalizedMsg,
          });
          studentLog.whatsappStatus = waRes.success ? 'Delivered' : 'Failed';
          studentLog.whatsappRecipient = phone;
        }
      }

      // 2. Email Dispatch
      if (channel === 'email' || channel === 'both') {
        const toEmail = student.parentEmail || student.email;
        if (toEmail) {
          const emailRes = await sendDirectEmailMessage({
            toEmail,
            subject: interpolateTemplate(emailSubject, student),
            recipientName: student.parentName || student.fatherName || 'Parent',
            studentName: student.name,
            bodyText: personalizedMsg,
          });
          studentLog.emailStatus = emailRes.success ? 'Delivered' : 'Failed';
          studentLog.emailRecipient = toEmail;
        }
      }

      dispatchedLog.push(studentLog);
    }

    return c.json({
      success: true,
      message: `Bulk notification sent to ${dispatchedLog.length} student/parent recipients via ${channel.toUpperCase()}!`,
      totalCount: dispatchedLog.length,
      dispatchedLog,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 8. Attendance Management
adminRouter.get('/attendance', async (c) => {
  const batch = c.req.query('batch') || 'Cohort Alpha (12-Month Diploma)';
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  const key = `${batch}_${date}`;

  // 1. Fetch all real students from MongoDB / memory
  const allStudents = await getActiveStudents();
  const batchStudents = allStudents.filter((s) => s.batch === batch);
  const targetStudents = batchStudents.length > 0 ? batchStudents : allStudents;

  // 2. Check in-memory store for today/current batch
  if (BATCH_ATTENDANCE_STORE[key] && BATCH_ATTENDANCE_STORE[key].length > 0) {
    // Merge any newly added students into the record
    const existingIds = new Set(BATCH_ATTENDANCE_STORE[key].map((r: any) => r.studentId));
    for (const s of targetStudents) {
      const sId = s.id || s._id;
      if (!existingIds.has(sId)) {
        BATCH_ATTENDANCE_STORE[key].push({
          studentId: sId,
          name: s.name,
          rollNumber: s.rollNumber,
          parentName: s.parentName || s.fatherName || 'Parent',
          parentWhatsApp: s.parentWhatsApp || s.fatherPhone || '',
          status: 'present',
          remarks: 'Present in campus lab',
        });
      }
    }
    return c.json({ success: true, records: BATCH_ATTENDANCE_STORE[key] });
  }

  // 3. Check MongoDB AttendanceModel for existing marked records on this date
  let savedAttendance: any[] = [];
  if (isMongoConnected()) {
    try {
      savedAttendance = await AttendanceModel.find({ date });
    } catch (e: any) {
      console.warn('AttendanceModel find fallback:', e.message);
    }
  }

  // Map each active student to an attendance record
  const initialRecords = targetStudents.map((s) => {
    const sId = s.id || s._id;
    const existing = savedAttendance.find((a) => a.studentId === sId);
    return {
      studentId: sId,
      name: s.name,
      rollNumber: s.rollNumber,
      parentName: s.parentName || s.fatherName || 'Parent',
      parentWhatsApp: s.parentWhatsApp || s.fatherPhone || '',
      status: existing ? existing.status : 'present',
      remarks: existing?.remarks || 'Present in campus lab',
    };
  });

  BATCH_ATTENDANCE_STORE[key] = initialRecords;
  return c.json({ success: true, records: initialRecords });
});

adminRouter.post('/attendance/mark', async (c) => {
  try {
    const body = await c.req.json();
    const { batch, date, records } = body;
    if (!batch || !date || !Array.isArray(records)) {
      return c.json({ success: false, message: 'Invalid payload' }, 400);
    }

    const key = `${batch}_${date}`;
    BATCH_ATTENDANCE_STORE[key] = records;

    // Persist to MongoDB AttendanceModel
    if (isMongoConnected()) {
      try {
        for (const r of records) {
          await AttendanceModel.findOneAndUpdate(
            { studentId: r.studentId, date },
            {
              studentId: r.studentId,
              date,
              status: r.status,
              session: 'full-day',
              remarks: r.remarks,
            },
            { upsert: true, new: true }
          );
        }
      } catch (dbErr: any) {
        console.warn('AttendanceModel save warning:', dbErr.message);
      }
    }

    const absentAlerts: any[] = [];
    for (const r of records) {
      if (r.status === 'absent' && r.parentWhatsApp) {
        await sendDirectWhatsAppMessage({
          phone: r.parentWhatsApp,
          recipientName: r.parentName,
          studentName: r.name,
          messageText: `Urgent Attendance Notice: Your child ${r.name} (${r.rollNumber}) is marked ABSENT today (${date}) at WeGrow Skill Campus without prior leave notice.`,
        });
        absentAlerts.push({ student: r.name, phone: r.parentWhatsApp });
      }
    }

    return c.json({
      success: true,
      message: `Batch attendance saved successfully! ${absentAlerts.length} WhatsApp notification(s) dispatched.`,
      dispatchedAlerts: absentAlerts,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// 9. Record Manual Fee Payment
adminRouter.post('/record-payment', async (c) => {
  try {
    const body = await c.req.json();
    const { studentId, amount, paymentMethod = 'UPI', feeType = 'Term Tuition Fee', referenceNumber } = body;

    const student = ADMIN_STUDENTS.find((s) => s.id === studentId || s._id === studentId);
    if (!student) {
      return c.json({ success: false, message: 'Student not found' }, 404);
    }

    const paidAmt = Number(amount) || 10000;
    const receiptNum = `RCPT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: any = {
      _id: `pay_${Date.now().toString(36)}`,
      studentId: student.id,
      studentName: student.name,
      receiptNumber: receiptNum,
      amount: paidAmt,
      currency: 'INR',
      feeType,
      method: paymentMethod,
      referenceNumber: referenceNumber || `REF_${Date.now().toString().slice(-6)}`,
      status: 'paid',
      date: new Date(),
    };

    SEED_DATA.payments.unshift(newPayment);
    student.paidFees += paidAmt;
    student.dueFees = Math.max(0, student.totalFees - student.paidFees);

    return c.json({
      success: true,
      message: `Payment of ₹${paidAmt.toLocaleString('en-IN')} recorded successfully! Receipt: ${receiptNum}`,
      payment: newPayment,
      studentSummary: {
        totalFees: student.totalFees,
        paidFees: student.paidFees,
        dueFees: student.dueFees,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
