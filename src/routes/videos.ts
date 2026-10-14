import { Hono } from 'hono';
import { SEED_DATA } from '../data/seedData.js';

export const videosRouter = new Hono();

// List all video lectures
videosRouter.get('/', (c) => {
  const subjectQuery = c.req.query('subject');
  let list = SEED_DATA.videos;

  if (subjectQuery && subjectQuery !== 'All') {
    list = list.filter((v) => v.subject.toLowerCase() === subjectQuery.toLowerCase());
  }

  return c.json({
    success: true,
    data: list,
  });
});

// Single video
videosRouter.get('/:id', (c) => {
  const id = c.req.param('id');
  const video = SEED_DATA.videos.find((v) => v._id === id);

  if (!video) {
    return c.json({ success: false, message: 'Video not found' }, 404);
  }

  return c.json({
    success: true,
    data: video,
  });
});

// Admin add/upload video lecture
videosRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { title, subject, duration, videoUrl, thumbnailUrl, teacher, description } = body;

    if (!title || !subject || !videoUrl) {
      return c.json({ success: false, message: 'Title, subject, and video URL are required' }, 400);
    }

    const newVideo: any = {
      _id: `vid_${Date.now().toString(36)}`,
      title,
      subject,
      grade: 'AI & GenAI Master Track',
      duration: duration || '45 mins',
      videoUrl,
      thumbnailUrl:
        thumbnailUrl ||
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      teacher: teacher || 'Lead AI Researcher',
      description: description || title,
      views: 0,
      createdAt: new Date(),
    };

    SEED_DATA.videos.unshift(newVideo);

    return c.json({
      success: true,
      message: 'Video lecture published to student portal catalog successfully!',
      data: newVideo,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

