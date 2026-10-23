import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed/seedData.js';

// Import Routes
import { authRouter as authRoutes } from './routes/auth.routes.js';
import { verificationRouter as verificationRoutes } from './routes/verification.routes.js';
import { directoryRouter as directoryRoutes } from './routes/directory.routes.js';
import { mentorshipRouter as mentorshipRoutes } from './routes/mentorship.routes.js';
import { chatRouter as chatRoutes } from './routes/chat.routes.js';
import { jobsRouter as jobsRoutes } from './routes/jobs.routes.js';
import { donationsRouter as donationsRoutes } from './routes/donations.routes.js';
import { eventsRouter as eventsRoutes } from './routes/events.routes.js';
import { storiesRouter as storiesRoutes } from './routes/stories.routes.js';
import { surveysRouter as surveysRoutes } from './routes/surveys.routes.js';
import { analyticsRouter as analyticsRoutes } from './routes/analytics.routes.js';
import auditRoutes from './routes/audit.routes.js';
import notificationRoutes from './routes/notification.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Gujarat State Alumni Association Portal',
    timestamp: new Date().toISOString(),
    version: '2.0.0-react-mongo',
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/surveys', surveysRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Boot Server
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      await connectDB();
      // Auto seed on boot if colleges collection is empty
      await seedDatabase();

      app.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 Gujarat Alumni Platform Backend (React + JS + Mongo)`);
        console.log(`📡 Listening on: http://localhost:${PORT}`);
        console.log(`🛡️  MongoDB connected with zero-config auto-fallback`);
        console.log(`======================================================\n`);
      });
    } catch (err) {
      console.error('Fatal startup error:', err);
      process.exit(1);
    }
  })();
}
