import { Hono } from 'hono';
import { SEED_DATA } from '../data/seedData.js';
import { CourseMaterialModel } from '../models/CourseMaterial.js';
import { isMongoConnected } from '../db/mongo.js';

export const materialsRouter = new Hono();

materialsRouter.get('/', async (c) => {
  const subjectQuery = c.req.query('subject');
  let list = SEED_DATA.courseMaterials;

  if (isMongoConnected()) {
    try {
      const mongoList = await CourseMaterialModel.find();
      if (mongoList.length > 0) list = mongoList as any;
    } catch (e) {
      console.warn('CourseMaterials Mongo fallback:', e);
    }
  }

  if (subjectQuery && subjectQuery !== 'All') {
    list = list.filter((m) => m.subject.toLowerCase() === subjectQuery.toLowerCase());
  }

  return c.json({ success: true, data: list });
});

materialsRouter.get('/:id', (c) => {
  const id = c.req.param('id');
  const item = SEED_DATA.courseMaterials.find((m) => m._id === id);

  if (!item) {
    return c.json({ success: false, message: 'Class note material not found' }, 404);
  }

  item.views = (item.views || 0) + 1;
  return c.json({ success: true, data: item });
});

// Admin/Teacher upload daily class note
materialsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { title, subject, grade, teacher, summary, content, tags = [] } = body;

    if (!title || !subject || !content) {
      return c.json({ success: false, message: 'Title, subject, and content are required' }, 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newMaterial: any = {
      _id: `mat_${Date.now().toString(36)}`,
      title,
      subject,
      grade: grade || 'AI & GenAI Master Track',
      date: todayStr,
      teacher: teacher || 'Faculty Academic Lead',
      summary: summary || title,
      content,
      tags: Array.isArray(tags) ? tags : [subject, 'Daily Notes'],
      views: 1,
    };

    SEED_DATA.courseMaterials.unshift(newMaterial);

    if (isMongoConnected()) {
      try {
        await CourseMaterialModel.create(newMaterial);
      } catch (err: any) {
        console.warn('CourseMaterial Mongo save:', err.message);
      }
    }

    return c.json({
      success: true,
      message: 'Daily class notes uploaded successfully',
      data: newMaterial,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});
