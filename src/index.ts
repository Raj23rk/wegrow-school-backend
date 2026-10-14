import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { ENV } from './config/env.js';
import { connectMongo } from './db/mongo.js';
import { authRouter } from './routes/auth.js';
import { dashboardRouter } from './routes/dashboard.js';
import { syllabusRouter } from './routes/syllabus.js';
import { videosRouter } from './routes/videos.js';
import { quizzesRouter } from './routes/quizzes.js';
import { materialsRouter } from './routes/materials.js';
import { assignmentsRouter } from './routes/assignments.js';
import { paymentsRouter } from './routes/payments.js';
import { adminRouter } from './routes/admin.js';
import { notificationsRouter } from './routes/notifications.js';

const app = new Hono();

// Middlewares
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    system: 'EduPulse Hono Backend API',
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
  });
});

// Mount Routes
app.route('/api/auth', authRouter);
app.route('/api/admin', adminRouter);
app.route('/api/dashboard', dashboardRouter);
app.route('/api/syllabus', syllabusRouter);
app.route('/api/videos', videosRouter);
app.route('/api/quizzes', quizzesRouter);
app.route('/api/materials', materialsRouter);
app.route('/api/assignments', assignmentsRouter);
app.route('/api/payments', paymentsRouter);
app.route('/api/v1/notifications', notificationsRouter);
app.route('/api/notifications', notificationsRouter);

import { syncAdminUsersToDatabase } from './data/adminUsers.js';

// Initialize database & start server
async function startServer() {
  await connectMongo();
  await syncAdminUsersToDatabase();

  serve(
    {
      fetch: app.fetch,
      port: ENV.PORT,
    },
    (info) => {
      console.log(`\n======================================================`);
      console.log(`🚀 EduPulse Hono Backend running on http://localhost:${info.port}`);
      console.log(`📚 Connected modules: MongoDB, Supabase, Razorpay, WhatsApp, Email`);
      console.log(`======================================================\n`);
    }
  );
}

startServer();
