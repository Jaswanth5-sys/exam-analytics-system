import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDbConnection } from './db/connection.js';
import { initializeSchema } from './db/schema.js';

import authRoutes from './routes/auth.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import userRoutes from './routes/user.routes.js';
import questionRoutes from './routes/question.routes.js';
import examRoutes from './routes/exam.routes.js';
import attemptRoutes from './routes/attempt.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Request logging in development
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: 'MonetDB 11.55.9',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    error: err?.message || 'An unexpected error occurred on the server.',
  });
});

// Start Server
async function startServer() {
  try {
    console.log('[Server] Connecting to MonetDB...');
    await getDbConnection();
    await initializeSchema();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`Exam Analytics Backend running on http://localhost:${PORT}`);
      console.log(`Primary Database: MonetDB (port ${process.env.MONETDB_PORT || 50000})`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
