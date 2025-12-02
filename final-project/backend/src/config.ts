import dotenv from 'dotenv';

dotenv.config();

export const config = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/tripcircle',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  jwtAlgorithm: 'HS256' as const,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  amplitudeApiKey: process.env.AMPLITUDE_API_KEY || '',
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Only warn in development
if (config.nodeEnv === 'development') {
  if (!process.env.DATABASE_URL) {
    console.warn('Warning: DATABASE_URL is not set, using default placeholder');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-key-change-in-production') {
    console.warn('Warning: JWT_SECRET is not set, using default placeholder (NOT SECURE FOR PRODUCTION)');
  }
}

