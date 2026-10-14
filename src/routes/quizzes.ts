import { Hono } from 'hono';
import { SEED_DATA } from '../data/seedData.js';
import { TestResultModel } from '../models/TestResult.js';
import { QuizModel } from '../models/Quiz.js';
import { isMongoConnected } from '../db/mongo.js';
import { sendParentEmailNotification, sendParentWhatsAppNotification } from '../services/notificationService.js';

export const quizzesRouter = new Hono();

// 1. List all active quiz tasks
quizzesRouter.get('/', async (c) => {
  let quizzes = SEED_DATA.quizzes;

  if (isMongoConnected()) {
    try {
      const mongoQuizzes = await QuizModel.find({ status: 'active' });
      if (mongoQuizzes.length > 0) quizzes = mongoQuizzes as any;
    } catch (e) {
      console.warn('Quizzes Mongo fallback:', e);
    }
  }

  // Sanitize: do not send correctOptionIndex in public list
  const sanitized = quizzes.map((q) => ({
    _id: q._id,
    title: q.title,
    subject: q.subject,
    grade: q.grade,
    description: q.description,
    durationMinutes: q.durationMinutes,
    totalMarks: q.totalMarks,
    passingMarks: q.passingMarks,
    dueDate: q.dueDate,
    questionCount: q.questions.length,
  }));

  return c.json({ success: true, data: sanitized });
});

// 2. Get single quiz questions (safe questions without answers)
quizzesRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  let quiz = SEED_DATA.quizzes.find((q) => q._id === id);

  if (isMongoConnected()) {
    try {
      const mongoQuiz = await QuizModel.findById(id);
      if (mongoQuiz) quiz = mongoQuiz as any;
    } catch (e) {
      console.warn('Quiz Mongo fetch fallback:', e);
    }
  }

  if (!quiz) {
    return c.json({ success: false, message: 'Quiz task not found' }, 404);
  }

  // Remove correctOptionIndex so student can't inspect element to see answers!
  const safeQuestions = (quiz.questions as any[]).map((q: any) => ({
    id: q.id,
    questionText: q.questionText,
    options: q.options,
    marks: q.marks,
  }));

  return c.json({
    success: true,
    data: {
      _id: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      grade: quiz.grade,
      description: quiz.description,
      durationMinutes: quiz.durationMinutes,
      totalMarks: quiz.totalMarks,
      passingMarks: quiz.passingMarks,
      dueDate: quiz.dueDate,
      questions: safeQuestions,
    },
  });
});

// 3. Admin upload new Question & Answer task
quizzesRouter.post('/admin/create', async (c) => {
  try {
    const body = await c.req.json();
    const { title, subject, grade, description, durationMinutes, passingMarks, questions } = body;

    if (!title || !subject || !questions || !Array.isArray(questions) || questions.length === 0) {
      return c.json({ success: false, message: 'Invalid quiz payload. Title, subject, and questions are required.' }, 400);
    }

    const totalMarks = questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 1), 0);
    const newQuizId = `quiz_${Date.now().toString(36)}`;

    const newQuiz: any = {
      _id: newQuizId,
      title,
      subject,
      grade: grade || 'AI & GenAI Master Track',
      description: description || '',
      durationMinutes: Number(durationMinutes) || 15,
      totalMarks,
      passingMarks: Number(passingMarks) || Math.round(totalMarks * 0.5),
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'active',
      questions: questions.map((q: any, idx: number) => ({
        id: q.id || `q_${idx + 1}`,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: Number(q.correctOptionIndex) || 0,
        explanation: q.explanation || '',
        marks: Number(q.marks) || 1,
      })),
      createdDate: new Date().toISOString(),
    };

    SEED_DATA.quizzes.unshift(newQuiz);

    if (isMongoConnected()) {
      try {
        await QuizModel.create(newQuiz);
      } catch (err: any) {
        console.warn('Quiz Mongo create warning:', err.message);
      }
    }

    return c.json({
      success: true,
      message: 'New task & questions uploaded successfully by Admin',
      data: newQuiz,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// 4. Student submits quiz -> Auto score -> SEND PARENT WHATSAPP & EMAIL NOTIFICATION
quizzesRouter.post('/:id/submit', async (c) => {
  try {
    const quizId = c.req.param('id');
    const body = await c.req.json();
    const { studentId, answers = {}, timeSpentSeconds = 0 } = body;

    let quiz = SEED_DATA.quizzes.find((q) => q._id === quizId);
    if (isMongoConnected()) {
      try {
        const mongoQuiz = await QuizModel.findById(quizId);
        if (mongoQuiz) quiz = mongoQuiz as any;
      } catch (e) {
        console.warn('Quiz fetch fallback:', e);
      }
    }

    if (!quiz) {
      return c.json({ success: false, message: 'Quiz task not found' }, 404);
    }

    const student = SEED_DATA.student || {
      _id: body.studentId || 'std_quiz_user',
      name: body.studentName || 'Student',
      email: body.studentEmail || 'student@wegrow.edu',
      parentName: body.parentName || 'Parent',
      parentEmail: body.parentEmail || 'parent@wegrow.edu',
      parentWhatsApp: body.parentWhatsApp || '+91 98765 43210',
    };

    // Evaluate answers
    let earnedMarks = 0;
    const questionReview = (quiz.questions as any[]).map((q: any) => {
      const studentSelected = answers[q.id];
      const isCorrect = studentSelected !== undefined && Number(studentSelected) === q.correctOptionIndex;
      if (isCorrect) {
        earnedMarks += q.marks;
      }
      return {
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        studentSelected,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        marksAwarded: isCorrect ? q.marks : 0,
        totalMarks: q.marks,
        explanation: q.explanation || '',
      };
    });

    const percentage = Math.round((earnedMarks / quiz.totalMarks) * 100);
    const passed = earnedMarks >= quiz.passingMarks;

    const feedback = passed
      ? percentage >= 85
        ? 'Excellent mastery of concepts! Keep up the brilliant performance.'
        : 'Good effort! Thorough revision recommended for missed questions.'
      : 'Needs more practice and conceptual review. Please revisit class notes and video lectures.';

    // 5. TRIGGER WHATSAPP AND EMAIL DISPATCH
    const notificationPayload = {
      studentName: student.name,
      studentEmail: student.email,
      parentName: student.parentName,
      parentEmail: student.parentEmail,
      parentWhatsApp: student.parentWhatsApp,
      quizTitle: quiz.title,
      subject: quiz.subject,
      score: earnedMarks,
      totalMarks: quiz.totalMarks,
      percentage,
      passed,
      timeSpentSeconds,
      feedback,
    };

    console.log(`[Auto-Trigger] Dispatching notifications for ${student.name}'s test results...`);
    const [whatsappResult, emailResult] = await Promise.all([
      sendParentWhatsAppNotification(notificationPayload),
      sendParentEmailNotification(notificationPayload),
    ]);

    const resultRecord: any = {
      _id: `res_${Date.now().toString(36)}`,
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      parentEmail: student.parentEmail,
      parentWhatsApp: student.parentWhatsApp,
      quizId: quiz._id,
      quizTitle: quiz.title,
      subject: quiz.subject,
      score: earnedMarks,
      totalMarks: quiz.totalMarks,
      percentage,
      passed,
      timeSpentSeconds,
      submittedAnswers: answers,
      whatsappStatus: whatsappResult.success ? 'sent' : 'failed',
      emailStatus: emailResult.success ? 'sent' : 'failed',
      whatsappMessageSid: whatsappResult.sid,
      emailMessageId: emailResult.messageId,
      feedback,
      submittedAt: new Date(),
    };

    // Save to results memory & MongoDB
    SEED_DATA.testResults.unshift(resultRecord);

    if (isMongoConnected()) {
      try {
        await TestResultModel.create(resultRecord);
      } catch (err: any) {
        console.warn('TestResult Mongo save warning:', err.message);
      }
    }

    return c.json({
      success: true,
      message: 'Task submitted and scored successfully! Parent notified via WhatsApp and Email.',
      result: {
        score: earnedMarks,
        totalMarks: quiz.totalMarks,
        percentage,
        passed,
        passingMarks: quiz.passingMarks,
        timeSpentSeconds,
        feedback,
        questionReview,
        parentAlerts: {
          whatsapp: {
            sent: whatsappResult.success,
            recipient: student.parentWhatsApp,
            parentName: student.parentName,
            details: whatsappResult.details,
          },
          email: {
            sent: emailResult.success,
            recipient: student.parentEmail,
            parentName: student.parentName,
            details: emailResult.details,
          },
        },
      },
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// 5. Get student test result history
quizzesRouter.get('/student/results', (c) => {
  return c.json({
    success: true,
    data: SEED_DATA.testResults,
  });
});

// 6. Admin delete quiz
quizzesRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const idx = SEED_DATA.quizzes.findIndex((q) => q._id === id);
    if (idx !== -1) {
      SEED_DATA.quizzes.splice(idx, 1);
    }
    if (isMongoConnected()) {
      try {
        await QuizModel.findByIdAndDelete(id);
      } catch (err: any) {
        console.warn('Quiz Mongo delete warning:', err.message);
      }
    }
    return c.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

