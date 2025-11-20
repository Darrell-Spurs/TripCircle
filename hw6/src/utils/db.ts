import mongoose from 'mongoose';

let isConnected = false;

/**
 * Connect to MongoDB database
 */
export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log('[DB] Already connected to MongoDB');
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('[DB] ✅ Connected to MongoDB');
  } catch (error) {
    console.error('[DB] ❌ MongoDB connection error:', error);
    isConnected = false;
    throw error;
  }

  // Handle connection events
  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('[DB] MongoDB disconnected');
    isConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[DB] MongoDB reconnected');
    isConnected = true;
  });
}

/**
 * Disconnect from MongoDB database
 */
export async function disconnectDB(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[DB] Disconnected from MongoDB');
  } catch (error) {
    console.error('[DB] Error disconnecting from MongoDB:', error);
    throw error;
  }
}

