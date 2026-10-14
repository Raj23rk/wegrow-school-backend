import { Hono } from 'hono';
import { SEED_DATA } from '../data/seedData.js';
import { AttendanceModel } from '../models/Attendance.js';
import { ClassScheduleModel } from '../models/ClassSchedule.js';
import { TestResultModel } from '../models/TestResult.js';
import { isMongoConnected } from '../db/mongo.js';

export const dashboardRouter = new Hono();

dashboardRouter.get('/stats', async (c) => {
  try {
    let attendance = SEED_DATA.attendanceRecords;
    let classes = SEED_DATA.classes;
    let testResults = SEED_DATA.testResults;

    if (isMongoConnected()) {
      try {
        const mongoAtt = await AttendanceModel.find();
        if (mongoAtt.length > 0) attendance = mongoAtt as any;

        const mongoCls = await ClassScheduleModel.find();
        if (mongoCls.length > 0) classes = mongoCls as any;

        const mongoRes = await TestResultModel.find();
        if (mongoRes.length > 0) testResults = mongoRes as any;
      } catch (e) {
        console.warn('Dashboard Mongo query fallback:', e);
      }
    }

    // 1. Attendance Metrics
    const totalAttendanceDays = attendance.length;
    const presentCount = attendance.filter((a) => a.status === 'present').length;
    const absentCount = attendance.filter((a) => a.status === 'absent').length;
    const lateCount = attendance.filter((a) => a.status === 'late' || a.status === 'excused').length;
    const attendancePercentage = totalAttendanceDays > 0 
      ? Math.round(((presentCount + lateCount * 0.5) / totalAttendanceDays) * 100) 
      : 0;

    // Attendance chart data (last 7 days)
    const recentAttendance = attendance.slice(0, 7).reverse().map((rec) => ({
      date: rec.date.slice(5),
      status: rec.status,
      score: rec.status === 'present' ? 100 : rec.status === 'late' ? 60 : 0,
      remarks: rec.remarks || '',
    }));

    // 2. Class Metrics
    const ongoingClasses = classes.filter((cls) => cls.status === 'ongoing');
    const upcomingClasses = classes.filter((cls) => cls.status === 'upcoming');
    const ongoingCount = ongoingClasses.length;
    const upcomingCount = upcomingClasses.length;

    // 3. Test Results Metrics
    const testsTaken = testResults.length;
    const totalScoreAchieved = testResults.reduce((acc, curr) => acc + curr.percentage, 0);
    const averageScore = testsTaken > 0 ? Math.round(totalScoreAchieved / testsTaken) : 0;
    const highestScore = testResults.length > 0 ? Math.max(...testResults.map((r) => r.percentage)) : 0;

    // Chart analytics datasets
    const subjectPerformance = testResults.length > 0
      ? testResults.slice(-5).map((r) => ({
          subject: r.subject || r.quizTitle || 'Assessment',
          score: r.percentage,
          fullMarks: 100,
        }))
      : [];

    const weeklyStudyHours = attendance.length > 0
      ? [
          { day: 'Mon', hours: 0, attendance: 0 },
          { day: 'Tue', hours: 0, attendance: 0 },
          { day: 'Wed', hours: 0, attendance: 0 },
          { day: 'Thu', hours: 0, attendance: 0 },
          { day: 'Fri', hours: 0, attendance: 0 },
          { day: 'Sat', hours: 0, attendance: 0 },
          { day: 'Sun', hours: 0, attendance: 0 },
        ]
      : [];

    return c.json({
      success: true,
      data: {
        student: SEED_DATA.student ? {
          name: SEED_DATA.student.name,
          rollNumber: SEED_DATA.student.rollNumber,
          grade: SEED_DATA.student.grade,
          section: SEED_DATA.student.section,
          avatar: SEED_DATA.student.avatar,
        } : null,
        attendance: {
          totalDays: totalAttendanceDays,
          presentCount,
          absentCount,
          lateCount,
          percentage: attendancePercentage,
          chartData: recentAttendance,
        },
        classes: {
          ongoingCount,
          upcomingCount,
          ongoingList: ongoingClasses,
          upcomingList: upcomingClasses,
          allToday: classes,
        },
        tests: {
          testsTaken,
          averageScore,
          highestScore,
          recentResults: testResults.slice(-5),
          subjectPerformance,
          weeklyStudyHours,
        },
      },
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});
