import { Hono } from 'hono';
import { SEED_DATA } from '../data/seedData.js';
import { AssignmentModel } from '../models/Assignment.js';
import { isMongoConnected } from '../db/mongo.js';

export const assignmentsRouter = new Hono();

assignmentsRouter.get('/', async (c) => {
  let list = SEED_DATA.assignments;

  if (isMongoConnected()) {
    try {
      const mongoList = await AssignmentModel.find();
      if (mongoList.length > 0) list = mongoList as any;
    } catch (e) {
      console.warn('Assignments Mongo fallback:', e);
    }
  }

  // Format with student submission status
  const studentId = SEED_DATA.student?._id;
  const formatted = list.map((asg) => {
    const studentSubmission = studentId ? (asg.submissions as any[]).find((s: any) => s.studentId === studentId) : null;
    return {
      _id: asg._id,
      title: asg.title,
      subject: asg.subject,
      grade: asg.grade,
      description: asg.description,
      assignedDate: asg.assignedDate,
      dueDate: asg.dueDate,
      totalMarks: asg.totalMarks,
      isSubmitted: !!studentSubmission,
      submission: studentSubmission || null,
    };
  });

  return c.json({ success: true, data: formatted });
});

// Student submit assignment
assignmentsRouter.post('/:id/submit', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { content, attachmentUrl, studentId: customStudentId, studentName: customStudentName } = body;

    if (!content) {
      return c.json({ success: false, message: 'Submission content or answer text is required' }, 400);
    }

    const assignment = SEED_DATA.assignments.find((a) => a._id === id);
    if (!assignment) {
      return c.json({ success: false, message: 'Assignment not found' }, 404);
    }

    const student = SEED_DATA.student || {
      _id: customStudentId || 'std_temp',
      name: customStudentName || 'Student',
    };
    const newSubmission: any = {
      studentId: student._id,
      studentName: student.name,
      submittedAt: new Date(),
      content,
      attachmentUrl: attachmentUrl || '/uploads/student_task_work.pdf',
      grade: 'Submitted (Pending Review)',
      marksObtained: undefined,
      teacherRemarks: 'Received successfully by subject department.',
      status: 'submitted',
    };

    const subs = assignment.submissions as any[];
    const existingIdx = subs.findIndex((s: any) => s.studentId === student._id);
    if (existingIdx >= 0) {
      subs[existingIdx] = newSubmission;
    } else {
      subs.push(newSubmission);
    }

    return c.json({
      success: true,
      message: 'Assignment submitted successfully!',
      submission: newSubmission,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// Admin create new assignment
assignmentsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { title, subject, grade, description, dueDate, totalMarks = 50 } = body;

    if (!title || !subject || !description) {
      return c.json({ success: false, message: 'Title, subject, and description are required' }, 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newAsg: any = {
      _id: `asg_${Date.now().toString(36)}`,
      title,
      subject,
      grade: grade || 'AI & GenAI Master Track',
      description,
      assignedDate: todayStr,
      dueDate: dueDate || todayStr,
      totalMarks: Number(totalMarks) || 50,
      submissions: [],
    };

    SEED_DATA.assignments.unshift(newAsg);
    if (isMongoConnected()) {
      try {
        await AssignmentModel.create(newAsg);
      } catch (err: any) {
        console.warn('Assignment Mongo save warning:', err.message);
      }
    }

    return c.json({
      success: true,
      message: 'New assignment created and assigned to students successfully!',
      data: newAsg,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin delete assignment
assignmentsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const idx = SEED_DATA.assignments.findIndex((a) => a._id === id);
    if (idx !== -1) {
      SEED_DATA.assignments.splice(idx, 1);
    }
    if (isMongoConnected()) {
      try {
        await AssignmentModel.findByIdAndDelete(id);
      } catch (err: any) {
        console.warn('Assignment Mongo delete warning:', err.message);
      }
    }
    return c.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});


