import { Hono } from 'hono';
import { SEED_DATA } from '../data/seedData.js';
import { AI_COURSE_SYLLABUS } from '../data/aiSyllabusData.js';

export const syllabusRouter = new Hono();

// Return view-only syllabus catalog
syllabusRouter.get('/', (c) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Content-Disposition', 'inline; filename="syllabus-view-only"');
 
 const syllabusData = SEED_DATA.syllabus && SEED_DATA.syllabus.length > 0 
 ? SEED_DATA.syllabus 
 : AI_COURSE_SYLLABUS;

 return c.json({
 success: true,
 policy: {
 downloadAllowed: false,
 printAllowed: false,
 watermarkEnabled: true,
 message: 'Notice: This syllabus is for verified academic viewing only. Direct downloading is disabled.',
 },
 data: syllabusData,
 });
});

// View single subject syllabus
syllabusRouter.get('/:id', (c) => {
 const id = c.req.param('id');
 const syllabusList = SEED_DATA.syllabus && SEED_DATA.syllabus.length > 0 
 ? SEED_DATA.syllabus 
 : AI_COURSE_SYLLABUS;
 const syllabus = syllabusList.find((s) => s.id === id);

 if (!syllabus) {
 return c.json({ success: false, message: 'Syllabus not found' }, 404);
 }

 return c.json({
 success: true,
 data: syllabus,
 });
});
