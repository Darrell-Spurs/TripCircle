import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Conversation from '@/lib/models/Conversation';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const conversation = await Conversation.findById(params.id);

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Format response with full message history
    const formatted = {
      id: conversation._id.toString(),
      userId: conversation.userId,
      messages: conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('[API] Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

