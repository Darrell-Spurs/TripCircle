import Conversation, { IConversation } from '../models/Conversation';
import { ChatMessage } from './openai.service';

/**
 * Get or create a conversation for a user
 */
export async function getOrCreateConversation(userId: string): Promise<IConversation> {
  let conversation = await Conversation.findOne({ userId });

  if (!conversation) {
    conversation = new Conversation({
      userId,
      messages: [],
    });
    await conversation.save();
    console.log(`[Conversation] Created new conversation for user: ${userId}`);
  }

  return conversation;
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<IConversation> {
  const conversation = await getOrCreateConversation(userId);

  conversation.messages.push({
    role,
    content,
    timestamp: new Date(),
  });

  // Limit conversation history to last 20 messages to avoid token limits
  const MAX_MESSAGES = 20;
  if (conversation.messages.length > MAX_MESSAGES) {
    conversation.messages = conversation.messages.slice(-MAX_MESSAGES);
  }

  await conversation.save();
  console.log(`[Conversation] Added ${role} message to conversation for user: ${userId}`);

  return conversation;
}

/**
 * Get conversation history for a user (formatted for OpenAI)
 */
export async function getConversationHistory(
  userId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  const conversation = await Conversation.findOne({ userId });

  if (!conversation || conversation.messages.length === 0) {
    return [];
  }

  // Get last N messages (excluding the current one)
  const recentMessages = conversation.messages.slice(-limit);

  // Convert to OpenAI format
  return recentMessages.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));
}

/**
 * Get conversation by user ID
 */
export async function getConversationByUserId(userId: string): Promise<IConversation | null> {
  return await Conversation.findOne({ userId });
}

/**
 * Get all conversations (for admin/dashboard)
 */
export async function getAllConversations(
  limit: number = 50,
  skip: number = 0
): Promise<IConversation[]> {
  return await Conversation.find()
    .sort({ updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .exec();
}

/**
 * Get conversation statistics
 */
export async function getConversationStats(): Promise<{
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
}> {
  const totalConversations = await Conversation.countDocuments();
  
  const conversations = await Conversation.find();
  const totalMessages = conversations.reduce(
    (sum, conv) => sum + conv.messages.length,
    0
  );

  // Active users in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeUsers = await Conversation.countDocuments({
    updatedAt: { $gte: oneDayAgo },
  });

  return {
    totalConversations,
    totalMessages,
    activeUsers,
  };
}

