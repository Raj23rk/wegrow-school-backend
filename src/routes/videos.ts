import { Hono } from 'hono';
import { SEED_DATA } from '../data/seedData.js';
import { VideoLectureModel } from '../models/VideoLecture.js';
import { isMongoConnected } from '../db/mongo.js';

export const videosRouter = new Hono();

// List all video lectures
videosRouter.get('/', async (c) => {
  const subjectQuery = c.req.query('subject');
  let list = SEED_DATA.videos;

  if (isMongoConnected()) {
    try {
      const mongoList = await VideoLectureModel.find().sort({ createdAt: -1 }).lean();
      if (mongoList && mongoList.length > 0) {
        const map = new Map<string, any>();
        for (const v of mongoList) map.set(v._id, v);
        for (const v of SEED_DATA.videos) {
          if (!map.has(v._id)) map.set(v._id, v);
        }
        list = Array.from(map.values());
      }
    } catch (e: any) {
      console.warn('Videos Mongo fallback:', e.message);
    }
  }

  if (subjectQuery && subjectQuery !== 'All') {
    list = list.filter((v) => v.subject.toLowerCase() === subjectQuery.toLowerCase());
  }

  return c.json({
    success: true,
    data: list,
  });
});

// Single video
videosRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  let video = SEED_DATA.videos.find((v) => v._id === id);

  if (!video && isMongoConnected()) {
    try {
      video = (await VideoLectureModel.findById(id).lean()) as any;
    } catch (e) {}
  }

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
    const { title, subject, duration, videoUrl, thumbnailUrl, teacher, description, grade } = body;

    if (!title || !subject || !videoUrl) {
      return c.json({ success: false, message: 'Title, subject, and video URL are required' }, 400);
    }

    const newVideo: any = {
      _id: `vid_${Date.now().toString(36)}`,
      title: title.trim(),
      subject: subject.trim(),
      grade: (grade || 'AI & GenAI Master Track').trim(),
      duration: (duration || '45 mins').trim(),
      videoUrl: videoUrl.trim(),
      thumbnailUrl:
        thumbnailUrl ||
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      teacher: (teacher || 'Lead AI Researcher').trim(),
      description: (description || title).trim(),
      views: 0,
      createdAt: new Date(),
    };

    SEED_DATA.videos.unshift(newVideo);

    if (isMongoConnected()) {
      try {
        await VideoLectureModel.create(newVideo);
      } catch (dbErr: any) {
        console.warn('Video Mongo save warning:', dbErr.message);
      }
    }

    return c.json({
      success: true,
      message: 'Video lecture published to student portal catalog successfully!',
      data: newVideo,
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

// Admin delete video lecture
videosRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const idx = SEED_DATA.videos.findIndex((v) => v._id === id);
    if (idx !== -1) {
      SEED_DATA.videos.splice(idx, 1);
    }

    if (isMongoConnected()) {
      try {
        await VideoLectureModel.deleteOne({ _id: id });
      } catch (e: any) {
        console.warn('Video Mongo delete warning:', e.message);
      }
    }

    return c.json({
      success: true,
      message: 'Video lecture removed successfully',
    });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

