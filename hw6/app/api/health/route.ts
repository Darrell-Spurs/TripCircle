import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function GET() {
  try {
    // Try to connect to database
    await connectDB();
    
    return NextResponse.json({
      status: 'OK',
      message: 'LINE Chatbot server is running',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        webhook: 'active',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'ERROR',
        message: 'Server is running but database connection failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

