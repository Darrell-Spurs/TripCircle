import dotenv from 'dotenv';

// Load environment variables FIRST, before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';

// Routes
import authRoutes from './routes/auth.routes';
import restaurantRoutes from './routes/restaurant.routes';
import visitRoutes from './routes/visit.routes';
import tagRoutes from './routes/tag.routes';
import statsRoutes from './routes/stats.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Debug: Check environment variables
app.get('/api/debug/env', (req, res) => {
  res.json({
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set',
    API_KEY_LENGTH: process.env.GOOGLE_MAPS_API_KEY?.length || 0,
    PORT: process.env.PORT || 'Not set',
  });
});

// Error handling
app.use(errorHandler);

export default app;
