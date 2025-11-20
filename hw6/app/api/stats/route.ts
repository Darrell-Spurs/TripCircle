import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getConversationStats } from '@/lib/services/conversation.service';

export async function GET() {
  try {
    await connectDB();

    const stats = await getConversationStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API] Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

