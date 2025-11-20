import dotenv from 'dotenv';

// Load environment variables FIRST, before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';

// Routes
import webhookRoutes from './routes/webhook.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Middleware
app.use(cors());

// IMPORTANT: LINE webhook requires raw body for signature verification
// Apply raw body parser only to webhook route BEFORE the route handler
// For other routes, use JSON parser
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware - log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.path !== '/webhook') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Routes
app.use('/webhook', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LINE Chatbot server is running' });
});

// Error handling
app.use(errorHandler);

export default app;

