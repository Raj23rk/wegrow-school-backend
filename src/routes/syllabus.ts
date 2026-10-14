import { Hono } from 'hono';
import { SEED_DATA } from '../data/seedData.js';

export const syllabusRouter = new Hono();

// Return view-only syllabus catalog
syllabusRouter.get('/', (c) => {
  // Set anti-download / caching headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Content-Disposition', 'inline; filename="syllabus-view-only"');
  
  return c.json({
    success: true,
    policy: {
      downloadAllowed: false,
      printAllowed: false,
      watermarkEnabled: true,
      message: 'Notice: This syllabus is for verified academic viewing only. Direct downloading is disabled.',
    },
    data: SEED_DATA.syllabus,
  });
});

// View single subject syllabus
syllabusRouter.get('/:id', (c) => {
  const id = c.req.param('id');
  const syllabus = SEED_DATA.syllabus.find((s) => s.id === id);

  if (!syllabus) {
    return c.json({ success: false, message: 'Syllabus not found' }, 404);
  }

  return c.json({
    success: true,
    data: syllabus,
  });
});
