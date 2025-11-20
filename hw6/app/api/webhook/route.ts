import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookEvent, TextMessage, MessageAPIResponseBase, validateSignature } from '@line/bot-sdk';
import { generateResponse, OpenAIError, getErrorMessage, ChatMessage } from '@/lib/services/openai.service';
import { addMessage, getConversationHistory } from '@/lib/services/conversation.service';
import { connectDB } from '@/lib/db';

// LINE Bot configuration
function getConfig() {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelSecret || !channelAccessToken) {
    throw new Error('LINE_CHANNEL_SECRET and LINE_CHANNEL_ACCESS_TOKEN must be set in environment variables');
  }

  return {
    channelSecret,
    channelAccessToken,
  };
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({ 
    status: 'OK', 
    message: 'LINE webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

// Disable body parsing for this route (needed for LINE signature verification)
export const runtime = 'nodejs';

// POST endpoint for LINE webhook
export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    const config = getConfig();
    const signature = req.headers.get('X-Line-Signature');

    console.log('[Webhook] Received request');
    console.log('[Webhook] Signature header:', signature ? 'Present' : 'Missing');

    // Get raw body for signature verification
    const body = await req.text();
    const bodyBuffer = Buffer.from(body);

    // Validate signature if present
    if (signature) {
      const isValid = validateSignature(bodyBuffer, config.channelSecret, signature);
      
      if (!isValid) {
        console.error('[Webhook] Invalid signature!');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('[Webhook] Signature validated successfully');
    } else {
      console.warn('[Webhook] No signature header - skipping validation (development mode?)');
    }

    // Parse body
    const webhookBody = JSON.parse(body);
    const client = new Client(config);
    const events: WebhookEvent[] = webhookBody.events || [];

    console.log(`[Webhook] Received ${events.length} event(s)`);

    // Process each event
    const promises = events.map(async (event: WebhookEvent) => {
      try {
        console.log(`[Webhook] Processing event type: ${event.type}`);
        
        // Handle only text messages
        if (event.type === 'message' && event.message.type === 'text') {
          const textMessage = event.message as TextMessage;
          const userMessage = textMessage.text;
          const replyToken = event.replyToken;
          const userId = event.source.userId || 'unknown';

          console.log(`[Webhook] Received text message from ${userId}: ${userMessage}`);

          // Save user message to database
          try {
            await addMessage(userId, 'user', userMessage);
            console.log(`[Webhook] Saved user message to database`);
          } catch (dbError) {
            console.error('[Webhook] Error saving user message to database:', dbError);
            // Continue processing even if DB save fails
          }

          // Get conversation history for context
          let conversationHistory: ChatMessage[] = [];
          try {
            conversationHistory = await getConversationHistory(userId, 10);
            console.log(`[Webhook] Retrieved ${conversationHistory.length} messages from conversation history`);
          } catch (dbError) {
            console.error('[Webhook] Error retrieving conversation history:', dbError);
            conversationHistory = []; // Use empty history if DB fails
          }

          // Generate response using OpenAI
          let aiResponse: string;
          try {
            console.log('[Webhook] Calling OpenAI API...');
            aiResponse = await generateResponse(userMessage, conversationHistory);
            console.log(`[Webhook] Generated response: ${aiResponse}`);
          } catch (error) {
            console.error('[Webhook] Error generating response:', error);
            
            // Get user-friendly error message
            if (error instanceof OpenAIError) {
              aiResponse = getErrorMessage(error);
            } else {
              aiResponse = 'Sorry, I encountered an error while processing your message. Please try again later.';
            }
          }

          // Save AI response to database
          try {
            await addMessage(userId, 'assistant', aiResponse);
            console.log(`[Webhook] Saved AI response to database`);
          } catch (dbError) {
            console.error('[Webhook] Error saving AI response to database:', dbError);
            // Continue even if DB save fails
          }

          // Reply to the user
          try {
            console.log('[Webhook] Sending reply to LINE...');
            const response: MessageAPIResponseBase = await client.replyMessage(replyToken, {
              type: 'text',
              text: aiResponse,
            });
            console.log('[Webhook] Reply sent successfully');
          } catch (error) {
            console.error('[Webhook] Error sending reply:', error);
          }
        } else if (event.type === 'message') {
          // Handle non-text messages (images, videos, etc.)
          console.log(`[Webhook] Received non-text message type: ${event.message.type}`);
          const replyToken = event.replyToken;
          try {
            await client.replyMessage(replyToken, {
              type: 'text',
              text: 'I can only process text messages at the moment. Please send me a text message!',
            });
          } catch (error) {
            console.error('[Webhook] Error sending non-text reply:', error);
          }
        } else {
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (error) {
        console.error('[Webhook] Error processing webhook event:', error);
        // Don't throw error to avoid LINE retrying
      }
    });

    // Wait for all events to be processed
    await Promise.all(promises);

    // Return 200 OK to LINE
    console.log('[Webhook] Sending 200 OK response to LINE');
    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('[Webhook] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

