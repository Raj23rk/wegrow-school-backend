import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AttendanceModel } from '../models/Attendance.js';
import { isMongoConnected } from '../db/mongo.js';
import { getActiveStudents } from './admin.js';

export const attendanceRouter = new Hono();

// Helper: Get YYYY-MM-DD for local date
export function getLocalDateString(d: Date = new Date()): string {
  // Use Indian Standard Time (UTC+5:30) offset
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
}

// Helper: Format Time string like "09:30 AM"
export function formatTimeString(d: Date = new Date()): string {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffset);
  let hours = istDate.getUTCHours();
  const minutes = istDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minStr = minutes < 10 ? '0' + minutes : String(minutes);
  return `${hours.toString().padStart(2, '0')}:${minStr} ${ampm}`;
}

// Helper: Parse time string like "09:30 AM" or "14:15" to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toUpperCase();
  const isPM = cleaned.includes('PM');
  const isAM = cleaned.includes('AM');
  const numPart = cleaned.replace(/[APM\s]/g, '');
  const [hStr, mStr] = numPart.split(':');
  let h = parseInt(hStr || '0', 10);
  const m = parseInt(mStr || '0', 10);

  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;

  return h * 60 + m;
}

// Helper: Compute duration hours between check-in and check-out
export function calculateDurationHours(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const inMin = parseTimeToMinutes(checkIn);
  const outMin = parseTimeToMinutes(checkOut);
  if (outMin <= inMin) return 0;
  const diffHours = (outMin - inMin) / 60;
  return Math.round(diffHours * 100) / 100;
}

// Helper: Get Start and End dates of Week (Monday to Sunday)
export function getWeekDateRange(dateStr: string): { startOfWeek: string; endOfWeek: string } {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = d.getUTCDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + distanceToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    startOfWeek: monday.toISOString().split('T')[0],
    endOfWeek: sunday.toISOString().split('T')[0],
  };
}

// Helper: Get Start and End dates of Month
export function getMonthDateRange(dateStr: string): { startOfMonth: string; endOfMonth: string } {
  const [year, month] = dateStr.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // last day of month

  return {
    startOfMonth: start.toISOString().split('T')[0],
    endOfMonth: end.toISOString().split('T')[0],
  };
}

// In-Memory Attendance Records Cache
export interface AttendanceEntry {
  _id?: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  batch: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string;
  checkOutTime?: string;
  checkInTimestamp?: Date;
  checkOutTimestamp?: Date;
  durationHours: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  session: 'morning' | 'afternoon' | 'full-day';
  remarks?: string;
  checkInMethod: 'student_portal' | 'admin_manual' | 'biometric';
  createdAt?: Date;
  updatedAt?: Date;
}

const ATTENDANCE_STORE: Map<string, AttendanceEntry> = new Map();

// Generate key for store
function makeKey(studentId: string, date: string): string {
  return `${studentId}_${date}`;
}

// Seed realistic historical attendance for active students so charts and hours look realistic immediately
let seedInitialized = false;
async function initializeSampleAttendance() {
  if (seedInitialized) return;
  seedInitialized = true;

  try {
    const students = await getActiveStudents();
    if (students.length === 0) return;

    const today = new Date();
    // Generate records for last 30 days
    for (let i = 30; i >= 1; i--) {
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - i);
      const dayOfWeek = pastDate.getDay();
      // Skip Sundays
      if (dayOfWeek === 0) continue;

      const dateStr = pastDate.toISOString().split('T')[0];

      for (const st of students) {
        const sId = (st.id || st._id || st.rollNumber).toString();
        const key = makeKey(sId, dateStr);

        // Deterministic variation based on roll and day
        const seedVal = (sId.charCodeAt(sId.length - 1) + i) % 10;
        const isLate = seedVal === 8;
        const isAbsent = seedVal === 9 && i > 3; // few absences

        if (isAbsent) {
          ATTENDANCE_STORE.set(key, {
            studentId: sId,
            studentName: st.name,
            rollNumber: st.rollNumber || 'WG26-001',
            batch: st.batch || 'Cohort Alpha (12-Month Diploma)',
            date: dateStr,
            status: 'absent',
            durationHours: 0,
            session: 'full-day',
            remarks: 'Absent - sick leave requested',
            checkInMethod: 'admin_manual',
            createdAt: pastDate,
          });
          continue;
        }

        const checkInHour = isLate ? '10:15 AM' : '09:15 AM';
        const checkOutHour = dayOfWeek === 6 ? '01:30 PM' : '05:30 PM';
        const hours = calculateDurationHours(checkInHour, checkOutHour);

        ATTENDANCE_STORE.set(key, {
          studentId: sId,
          studentName: st.name,
          rollNumber: st.rollNumber || 'WG26-001',
          batch: st.batch || 'Cohort Alpha (12-Month Diploma)',
          date: dateStr,
          checkInTime: checkInHour,
          checkOutTime: checkOutHour,
          durationHours: hours,
          status: isLate ? 'late' : 'present',
          session: 'full-day',
          remarks: isLate ? 'Late arrival (transport)' : 'AI Lab Session Completed',
          checkInMethod: 'student_portal',
          createdAt: pastDate,
        });
      }
    }
  } catch (err) {
    console.warn('[Attendance] Sample seed warning:', err);
  }
}

// Compute hours for a student in a specific date range
export async function getStudentHoursInRange(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<{ totalHours: number; daysPresent: number; records: AttendanceEntry[] }> {
  await initializeSampleAttendance();

  const records: AttendanceEntry[] = [];
  let totalHours = 0;
  let daysPresent = 0;

  // 1. Check in-memory store
  for (const entry of ATTENDANCE_STORE.values()) {
    if (
      (entry.studentId === studentId || entry.rollNumber === studentId) &&
      entry.date >= startDate &&
      entry.date <= endDate
    ) {
      records.push(entry);
      totalHours += entry.durationHours || 0;
      if (entry.status === 'present' || entry.status === 'late') {
        daysPresent++;
      }
    }
  }

  // 2. Also check MongoDB if connected and merge
  if (isMongoConnected()) {
    try {
      const dbRecords = await AttendanceModel.find({
        $or: [{ studentId }, { rollNumber: studentId }],
        date: { $gte: startDate, $lte: endDate },
      });

      for (const doc of dbRecords) {
        const found = records.find((r) => r.date === doc.date);
        if (!found) {
          const entry: AttendanceEntry = {
            studentId: doc.studentId,
            studentName: doc.studentName || '',
            rollNumber: doc.rollNumber || '',
            batch: doc.batch || '',
            date: doc.date,
            checkInTime: doc.checkInTime,
            checkOutTime: doc.checkOutTime,
            durationHours: doc.durationHours || 0,
            status: doc.status || 'present',
            session: doc.session || 'full-day',
            remarks: doc.remarks,
            checkInMethod: doc.checkInMethod || 'student_portal',
          };
          records.push(entry);
          totalHours += entry.durationHours || 0;
          if (entry.status === 'present' || entry.status === 'late') {
            daysPresent++;
          }
        }
      }
    } catch (e) {
      console.warn('[Attendance] Mongo getStudentHoursInRange fallback:', e);
    }
  }

  // Sort descending by date
  records.sort((a, b) => b.date.localeCompare(a.date));

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    daysPresent,
    records,
  };
}

// Extract auth token and student if present
async function getStudentFromAuth(c: any): Promise<any | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    return decoded;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// 1. POST /api/attendance/check-in
// Student or Admin takes daily check-in
// ----------------------------------------------------
attendanceRouter.post('/check-in', async (c) => {
  try {
    await initializeSampleAttendance();
    const authUser = await getStudentFromAuth(c);
    const body = await c.req.json().catch(() => ({}));

    // Target student ID: from body or from auth token
    const studentId = (body.studentId || authUser?.id || authUser?.rollNumber || '').toString().trim();
    if (!studentId) {
      return c.json({ success: false, message: 'Student ID or active session required' }, 400);
    }

    const allStudents = await getActiveStudents();
    const studentObj = allStudents.find(
      (s) =>
        s.id === studentId ||
        s._id === studentId ||
        s.rollNumber === studentId ||
        s.email === authUser?.email
    );

    const studentName = body.studentName || studentObj?.name || authUser?.name || 'Student';
    const rollNumber = studentObj?.rollNumber || authUser?.rollNumber || body.rollNumber || 'WG26-001';
    const batch = studentObj?.batch || authUser?.batch || body.batch || 'Cohort Alpha (12-Month Diploma)';

    const date = body.date || getLocalDateString();
    const checkInTime = body.checkInTime || formatTimeString();
    const key = makeKey(studentId, date);

    let existing = ATTENDANCE_STORE.get(key);

    if (existing && existing.checkInTime) {
      // Already checked in today
      const weekRange = getWeekDateRange(date);
      const monthRange = getMonthDateRange(date);
      const weekStats = await getStudentHoursInRange(studentId, weekRange.startOfWeek, weekRange.endOfWeek);
      const monthStats = await getStudentHoursInRange(studentId, monthRange.startOfMonth, monthRange.endOfMonth);

      return c.json({
        success: true,
        alreadyCheckedIn: true,
        message: `Welcome back, ${studentName}! You already checked in today at ${existing.checkInTime}.`,
        record: existing,
        todayStats: {
          hasCheckedIn: true,
          checkInTime: existing.checkInTime,
          hasCheckedOut: Boolean(existing.checkOutTime),
          checkOutTime: existing.checkOutTime,
          todayHours: existing.durationHours || 0,
        },
        weeklyStats: {
          totalHoursWeek: weekStats.totalHours,
          daysPresentWeek: weekStats.daysPresent,
        },
        monthlyStats: {
          totalHoursMonth: monthStats.totalHours,
          daysPresentMonth: monthStats.daysPresent,
        },
      });
    }

    const newRecord: AttendanceEntry = {
      studentId,
      studentName,
      rollNumber,
      batch,
      date,
      checkInTime,
      checkInTimestamp: new Date(),
      durationHours: 0,
      status: 'present',
      session: 'full-day',
      remarks: body.remarks || 'Daily AI Lab Check-In recorded via Student Portal',
      checkInMethod: body.checkInMethod || (authUser?.role === 'admin' ? 'admin_manual' : 'student_portal'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    ATTENDANCE_STORE.set(key, newRecord);

    // Persist to MongoDB if connected
    if (isMongoConnected()) {
      try {
        await AttendanceModel.findOneAndUpdate(
          { studentId, date },
          {
            studentId,
            studentName,
            rollNumber,
            batch,
            date,
            checkInTime,
            checkInTimestamp: newRecord.checkInTimestamp,
            status: 'present',
            session: 'full-day',
            remarks: newRecord.remarks,
            checkInMethod: newRecord.checkInMethod,
          },
          { upsert: true, new: true }
        );
      } catch (err: any) {
        console.warn('[Attendance] Mongo check-in save fallback:', err.message);
      }
    }

    const weekRange = getWeekDateRange(date);
    const monthRange = getMonthDateRange(date);
    const weekStats = await getStudentHoursInRange(studentId, weekRange.startOfWeek, weekRange.endOfWeek);
    const monthStats = await getStudentHoursInRange(studentId, monthRange.startOfMonth, monthRange.endOfMonth);

    return c.json({
      success: true,
      message: `🎉 Great to see you, ${studentName}! Check-in recorded at ${checkInTime}.`,
      record: newRecord,
      todayStats: {
        hasCheckedIn: true,
        checkInTime,
        hasCheckedOut: false,
        checkOutTime: undefined,
        todayHours: 0,
      },
      weeklyStats: {
        totalHoursWeek: weekStats.totalHours,
        daysPresentWeek: weekStats.daysPresent,
      },
      monthlyStats: {
        totalHoursMonth: monthStats.totalHours,
        daysPresentMonth: monthStats.daysPresent,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message || 'Check-in failed' }, 500);
  }
});

// ----------------------------------------------------
// 2. POST /api/attendance/check-out
// Student or Admin takes daily check-out & computes duration
// ----------------------------------------------------
attendanceRouter.post('/check-out', async (c) => {
  try {
    await initializeSampleAttendance();
    const authUser = await getStudentFromAuth(c);
    const body = await c.req.json().catch(() => ({}));

    const studentId = (body.studentId || authUser?.id || authUser?.rollNumber || '').toString().trim();
    if (!studentId) {
      return c.json({ success: false, message: 'Student ID or active session required' }, 400);
    }

    const date = body.date || getLocalDateString();
    const checkOutTime = body.checkOutTime || formatTimeString();
    const key = makeKey(studentId, date);

    let record = ATTENDANCE_STORE.get(key);

    if (!record || !record.checkInTime) {
      // No check-in was found for today, create check-in with default 09:15 AM
      const allStudents = await getActiveStudents();
      const studentObj = allStudents.find(
        (s) => s.id === studentId || s._id === studentId || s.rollNumber === studentId
      );
      record = {
        studentId,
        studentName: studentObj?.name || authUser?.name || 'Student',
        rollNumber: studentObj?.rollNumber || authUser?.rollNumber || 'WG26-001',
        batch: studentObj?.batch || 'Cohort Alpha (12-Month Diploma)',
        date,
        checkInTime: '09:15 AM',
        checkInTimestamp: new Date(Date.now() - 6 * 3600 * 1000), // 6 hours ago
        durationHours: 0,
        status: 'present',
        session: 'full-day',
        remarks: 'Auto-linked check-in on checkout',
        checkInMethod: 'student_portal',
      };
    }

    // Calculate duration hours
    const duration = calculateDurationHours(record.checkInTime || '09:15 AM', checkOutTime);
    record.checkOutTime = checkOutTime;
    record.checkOutTimestamp = new Date();
    record.durationHours = duration > 0 ? duration : 1.0; // minimum 1 hour credit
    record.status = 'present';
    if (body.remarks) record.remarks = body.remarks;
    record.updatedAt = new Date();

    ATTENDANCE_STORE.set(key, record);

    // Persist to MongoDB
    if (isMongoConnected()) {
      try {
        await AttendanceModel.findOneAndUpdate(
          { studentId, date },
          {
            checkOutTime,
            checkOutTimestamp: record.checkOutTimestamp,
            durationHours: record.durationHours,
            status: record.status,
            remarks: record.remarks,
          },
          { upsert: true, new: true }
        );
      } catch (err: any) {
        console.warn('[Attendance] Mongo check-out save fallback:', err.message);
      }
    }

    const weekRange = getWeekDateRange(date);
    const monthRange = getMonthDateRange(date);
    const weekStats = await getStudentHoursInRange(studentId, weekRange.startOfWeek, weekRange.endOfWeek);
    const monthStats = await getStudentHoursInRange(studentId, monthRange.startOfMonth, monthRange.endOfMonth);

    return c.json({
      success: true,
      message: `🏁 Check-out recorded at ${checkOutTime}. Awesome effort today! Total logged: ${record.durationHours} hours.`,
      record,
      todayStats: {
        hasCheckedIn: true,
        checkInTime: record.checkInTime,
        hasCheckedOut: true,
        checkOutTime,
        todayHours: record.durationHours,
      },
      weeklyStats: {
        totalHoursWeek: weekStats.totalHours,
        daysPresentWeek: weekStats.daysPresent,
      },
      monthlyStats: {
        totalHoursMonth: monthStats.totalHours,
        daysPresentMonth: monthStats.daysPresent,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message || 'Check-out failed' }, 500);
  }
});

// ----------------------------------------------------
// 3. GET /api/attendance/student-status
// Returns today's checkin/out status, week hours, month hours, and recent history
// ----------------------------------------------------
attendanceRouter.get('/student-status', async (c) => {
  try {
    await initializeSampleAttendance();
    const authUser = await getStudentFromAuth(c);
    const paramStudentId = c.req.query('studentId');
    const studentId = (paramStudentId || authUser?.id || authUser?.rollNumber || '').toString().trim();

    if (!studentId) {
      return c.json({ success: false, message: 'Student ID or session required' }, 400);
    }

    const todayStr = getLocalDateString();
    const key = makeKey(studentId, todayStr);
    let todayRecord = ATTENDANCE_STORE.get(key);

    if (!todayRecord && isMongoConnected()) {
      try {
        const doc = await AttendanceModel.findOne({ studentId, date: todayStr });
        if (doc) {
          todayRecord = {
            studentId: doc.studentId,
            studentName: doc.studentName || '',
            rollNumber: doc.rollNumber || '',
            batch: doc.batch || '',
            date: doc.date,
            checkInTime: doc.checkInTime,
            checkOutTime: doc.checkOutTime,
            durationHours: doc.durationHours || 0,
            status: doc.status || 'present',
            session: doc.session || 'full-day',
            remarks: doc.remarks,
            checkInMethod: doc.checkInMethod || 'student_portal',
          };
          ATTENDANCE_STORE.set(key, todayRecord);
        }
      } catch (e) {
        // ignore
      }
    }

    const weekRange = getWeekDateRange(todayStr);
    const monthRange = getMonthDateRange(todayStr);

    const weekStats = await getStudentHoursInRange(studentId, weekRange.startOfWeek, weekRange.endOfWeek);
    const monthStats = await getStudentHoursInRange(studentId, monthRange.startOfMonth, monthRange.endOfMonth);

    // Calculate live active duration if checked in and not checked out
    let activeMinutes = 0;
    if (todayRecord && todayRecord.checkInTime && !todayRecord.checkOutTime) {
      const nowMin = parseTimeToMinutes(formatTimeString());
      const inMin = parseTimeToMinutes(todayRecord.checkInTime);
      activeMinutes = Math.max(0, nowMin - inMin);
    }

    return c.json({
      success: true,
      studentId,
      todayStr,
      todayStats: {
        hasCheckedIn: Boolean(todayRecord?.checkInTime),
        checkInTime: todayRecord?.checkInTime,
        hasCheckedOut: Boolean(todayRecord?.checkOutTime),
        checkOutTime: todayRecord?.checkOutTime,
        todayHours: todayRecord?.durationHours || Math.round((activeMinutes / 60) * 10) / 10,
        activeMinutes,
        status: todayRecord?.status || 'not_checked_in',
        record: todayRecord || null,
      },
      weeklyStats: {
        weekStart: weekRange.startOfWeek,
        weekEnd: weekRange.endOfWeek,
        totalHoursWeek: weekStats.totalHours,
        daysPresentWeek: weekStats.daysPresent,
        records: weekStats.records,
      },
      monthlyStats: {
        monthStart: monthRange.startOfMonth,
        monthEnd: monthRange.endOfMonth,
        totalHoursMonth: monthStats.totalHours,
        daysPresentMonth: monthStats.daysPresent,
        records: monthStats.records.slice(0, 15), // recent 15 records
      },
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ----------------------------------------------------
// 4. GET /api/attendance/students-timesheet
// Admin Timesheet: Student name, Check-in, Check-out, Total hours per week & per month
// ----------------------------------------------------
attendanceRouter.get('/students-timesheet', async (c) => {
  try {
    await initializeSampleAttendance();

    const targetDate = c.req.query('date') || getLocalDateString();
    const targetBatch = c.req.query('batch');
    const search = (c.req.query('search') || '').trim().toLowerCase();

    const allStudents = await getActiveStudents();

    let filtered = allStudents;
    if (targetBatch && targetBatch !== 'all') {
      filtered = filtered.filter(
        (s) => (s.batch || '').toLowerCase() === targetBatch.toLowerCase()
      );
    }

    if (search) {
      filtered = filtered.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(search) ||
          (s.rollNumber || '').toLowerCase().includes(search) ||
          (s.email || '').toLowerCase().includes(search)
      );
    }

    const weekRange = getWeekDateRange(targetDate);
    const monthRange = getMonthDateRange(targetDate);

    let campusCheckedInToday = 0;
    let campusCompletedToday = 0;
    let campusAbsentToday = 0;
    let totalCampusHoursThisWeek = 0;
    let totalCampusHoursThisMonth = 0;

    const timesheet = await Promise.all(
      filtered.map(async (st) => {
        const sId = (st.id || st._id || st.rollNumber).toString();
        const key = makeKey(sId, targetDate);

        let todayRec = ATTENDANCE_STORE.get(key);
        if (!todayRec && isMongoConnected()) {
          try {
            const doc = await AttendanceModel.findOne({
              $or: [{ studentId: sId }, { rollNumber: st.rollNumber }],
              date: targetDate,
            });
            if (doc) {
              todayRec = {
                studentId: doc.studentId,
                studentName: doc.studentName || st.name,
                rollNumber: doc.rollNumber || st.rollNumber,
                batch: doc.batch || st.batch,
                date: doc.date,
                checkInTime: doc.checkInTime,
                checkOutTime: doc.checkOutTime,
                durationHours: doc.durationHours || 0,
                status: doc.status || 'present',
                session: doc.session || 'full-day',
                remarks: doc.remarks,
                checkInMethod: doc.checkInMethod || 'student_portal',
              };
              ATTENDANCE_STORE.set(key, todayRec);
            }
          } catch (e) {
            // ignore
          }
        }

        // Fetch Weekly and Monthly stats
        const weekStats = await getStudentHoursInRange(sId, weekRange.startOfWeek, weekRange.endOfWeek);
        const monthStats = await getStudentHoursInRange(sId, monthRange.startOfMonth, monthRange.endOfMonth);

        totalCampusHoursThisWeek += weekStats.totalHours;
        totalCampusHoursThisMonth += monthStats.totalHours;

        const hasCheckedIn = Boolean(todayRec?.checkInTime);
        const hasCheckedOut = Boolean(todayRec?.checkOutTime);

        if (hasCheckedIn && !hasCheckedOut) campusCheckedInToday++;
        if (hasCheckedIn && hasCheckedOut) campusCompletedToday++;
        if (todayRec?.status === 'absent') campusAbsentToday++;

        return {
          studentId: sId,
          name: st.name,
          rollNumber: st.rollNumber || 'WG26-001',
          batch: st.batch || 'Cohort Alpha (12-Month Diploma)',
          avatar: st.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          email: st.email || '',
          phone: st.phone || st.parentWhatsApp || '',
          date: targetDate,
          checkInTime: todayRec?.checkInTime || '—',
          checkOutTime: todayRec?.checkOutTime || (hasCheckedIn ? 'Active Now' : '—'),
          durationHoursToday: todayRec?.durationHours || 0,
          totalHoursWeek: weekStats.totalHours,
          totalHoursMonth: monthStats.totalHours,
          daysPresentMonth: monthStats.daysPresent,
          status: todayRec ? todayRec.status : 'not_marked',
          remarks: todayRec?.remarks || '',
          checkInMethod: todayRec?.checkInMethod || 'student_portal',
          recentHistory: monthStats.records.slice(0, 7),
        };
      })
    );

    const totalStudents = filtered.length;
    const avgHoursWeek =
      totalStudents > 0
        ? Math.round((totalCampusHoursThisWeek / totalStudents) * 10) / 10
        : 0;

    return c.json({
      success: true,
      targetDate,
      weekRange,
      monthRange,
      summary: {
        totalStudents,
        checkedInToday: campusCheckedInToday,
        completedToday: campusCompletedToday,
        absentToday: campusAbsentToday,
        totalCampusHoursThisWeek: Math.round(totalCampusHoursThisWeek * 10) / 10,
        totalCampusHoursThisMonth: Math.round(totalCampusHoursThisMonth * 10) / 10,
        avgHoursWeek,
      },
      timesheet,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// ----------------------------------------------------
// 5. POST /api/attendance/manual-entry
// Admin manually records or edits check-in, check-out, status, and remarks
// ----------------------------------------------------
attendanceRouter.post('/manual-entry', async (c) => {
  try {
    const body = await c.req.json();
    const { studentId, date, checkInTime, checkOutTime, status, remarks } = body;

    if (!studentId || !date) {
      return c.json({ success: false, message: 'studentId and date are required' }, 400);
    }

    const allStudents = await getActiveStudents();
    const st = allStudents.find((s) => s.id === studentId || s._id === studentId || s.rollNumber === studentId);

    const key = makeKey(studentId, date);
    let duration = 0;
    if (checkInTime && checkOutTime) {
      duration = calculateDurationHours(checkInTime, checkOutTime);
    }

    const entry: AttendanceEntry = {
      studentId,
      studentName: st?.name || body.studentName || 'Student',
      rollNumber: st?.rollNumber || body.rollNumber || 'WG26-001',
      batch: st?.batch || body.batch || 'Cohort Alpha (12-Month Diploma)',
      date,
      checkInTime: checkInTime || '',
      checkOutTime: checkOutTime || '',
      durationHours: duration,
      status: status || 'present',
      session: 'full-day',
      remarks: remarks || 'Recorded via Admin Manual Entry',
      checkInMethod: 'admin_manual',
      updatedAt: new Date(),
    };

    ATTENDANCE_STORE.set(key, entry);

    if (isMongoConnected()) {
      try {
        await AttendanceModel.findOneAndUpdate(
          { studentId, date },
          {
            ...entry,
          },
          { upsert: true, new: true }
        );
      } catch (e: any) {
        console.warn('[Attendance] Mongo manual entry save warning:', e.message);
      }
    }

    return c.json({
      success: true,
      message: `Attendance log updated for ${entry.studentName} on ${date}.`,
      record: entry,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
