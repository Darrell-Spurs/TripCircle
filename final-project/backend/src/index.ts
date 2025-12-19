import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { config } from './config';
import authRoutes from './routes/auth';
import tripsRoutes from './routes/trips';
import activitiesRoutes from './routes/activities';
import membersRoutes from './routes/members';
import shareRoutes from './routes/share';
import placesRoutes from './routes/places';
import eventsRoutes from './routes/events';
import adminRoutes from './routes/admin';
import feedRoutes from './routes/feed';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrls,
  credentials: true,
}));

// Add request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    query: req.query,
    origin: req.headers.origin,
  });
  next();
});

app.use(express.json());
app.use(passport.initialize());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'TripCircle API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/trips', tripsRoutes);
app.use('/activities', activitiesRoutes);
app.use('/members', membersRoutes);
app.use('/share', shareRoutes);
app.use('/places', placesRoutes);
app.use('/events', eventsRoutes);
app.use('/admin', adminRoutes);
app.use('/feed', feedRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ detail: 'Internal server error' });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

