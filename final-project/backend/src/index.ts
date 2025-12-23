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
import photosRoutes from './routes/photos';
import locationFoldersRoutes from './routes/locationFolders';

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

// Increase body parser limit to handle base64-encoded images (10MB file = ~13.3MB base64)
// Set to 15MB to provide some headroom
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
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
app.use('/photos', photosRoutes);
app.use('/location-folders', locationFoldersRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);

  // Handle payload too large error specifically
  if (err.type === 'entity.too.large' || err.name === 'PayloadTooLargeError') {
    res.status(413).json({
      detail: 'File size too large. Please use an image smaller than 10MB, or use a URL instead of uploading directly.',
    });
    return;
  }

  // Handle other errors
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    detail: err.message || 'Internal server error',
  });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

