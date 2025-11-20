import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getAllConversations } from '@/lib/services/conversation.service';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const userId = searchParams.get('userId') || null;

    let conversations;
    
    if (userId) {
      // Filter by specific user
      const { getConversationByUserId } = await import('@/lib/services/conversation.service');
      const conversation = await getConversationByUserId(userId);
      conversations = conversation ? [conversation] : [];
    } else {
      conversations = await getAllConversations(limit, skip);
    }

    // Format response
    const formatted = conversations.map((conv) => ({
      id: conv._id.toString(),
      userId: conv.userId,
      messageCount: conv.messages.length,
      lastMessage: conv.messages.length > 0 
        ? {
            role: conv.messages[conv.messages.length - 1].role,
            content: conv.messages[conv.messages.length - 1].content.substring(0, 100),
            timestamp: conv.messages[conv.messages.length - 1].timestamp,
          }
        : null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));

    return NextResponse.json({
      conversations: formatted,
      total: formatted.length,
      limit,
      skip,
    });
  } catch (error) {
    console.error('[API] Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

