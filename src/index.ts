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

const ALLOWED_ORIGINS = [
  'https://school.wegrowbschool.in',
  'http://school.wegrowbschool.in',
  'https://www.school.wegrowbschool.in',
  'http://www.school.wegrowbschool.in',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// Middlewares
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return '*';
      if (
        ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith('.wegrowbschool.in') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return origin;
      }
      return origin; // dynamically reflect origin so credentials work seamlessly
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Headers',
      'Access-Control-Request-Method',
    ],
    credentials: true,
    maxAge: 86400,
  })
);

// Global OPTIONS preflight handler
app.options('*', (c) => c.body(null, 204));

// Root welcome & health endpoints
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    system: 'WeGrow School Backend API',
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
  });
});

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    system: 'WeGrow School Backend API',
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
