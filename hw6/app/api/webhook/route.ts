import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookEvent, TextMessage, MessageAPIResponseBase, validateSignature } from '@line/bot-sdk';
import { generateResponse, OpenAIError, getErrorMessage, ChatMessage } from '@/lib/services/openai.service';
import { addMessage, getConversationHistory } from '@/lib/services/conversation.service';
import { connectDB } from '@/lib/db';
import { checkPendingReview, processFollowUpAnswer } from '@/lib/services/follow-up.service';
import { extractReviewInfo } from '@/lib/services/review-extraction.service';
import { processReviewData, saveReview } from '@/lib/services/review-processing.service';
import { savePendingReview, generateFollowUpQuestion } from '@/lib/services/follow-up.service';
import { processCommand } from '@/lib/services/command-handler';
import { createWelcomeMessage } from '@/lib/utils/line-templates';

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

/**
 * Detect if message is a food review
 */
function detectReviewIntent(message: string): boolean {
  const reviewKeywords = [
    '去吃',
    '吃了',
    '餐廳',
    '推薦',
    '好吃',
    '雷',
    '食記',
    '用餐',
    '點餐',
    '點',
    '元',
    '塊',
    '價格',
    '貴',
    '便宜',
    '早餐',
    '午餐',
    '晚餐',
    '鼎泰豐',
    '八方雲集',
    '麥當勞',
    '肯德基',
    '星巴克',
  ];

  const lowerMessage = message.toLowerCase();
  return reviewKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Format review confirmation message
 */
function formatReviewConfirmation(review: any): string {
  const priceText = review.price === '高' ? '高' : review.price === '中' ? '中' : '便宜';
  const mealTypeText =
    review.mealType === 'breakfast'
      ? '早餐'
      : review.mealType === 'lunch'
        ? '午餐'
        : '晚餐';

  let message = `✅ 已記錄你的食記！\n\n`;
  message += `🍽️ 餐廳：${review.restaurantName}\n`;
  message += `💰 價格：${priceText}\n`;
  message += `🍴 餐點：${mealTypeText}\n`;
  message += `⭐ 評分：${review.rating}/5\n`;
  if (review.tags && review.tags.length > 0) {
    message += `🏷️ 標籤：${review.tags.join('、')}\n`;
  }
  message += `\n📝 ${review.aiSummary}\n\n`;
  message += `感謝分享！`;

  return message;
}

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
        
        // Handle follow event (user added bot as friend)
        if (event.type === 'follow') {
          const replyToken = event.replyToken;
          const userId = event.source.userId || 'unknown';
          console.log(`[Webhook] New user followed: ${userId}`);
          
          try {
            const welcomeMsg = createWelcomeMessage();
            await client.replyMessage(replyToken, welcomeMsg);
            console.log('[Webhook] Sent welcome message');
          } catch (error) {
            console.error('[Webhook] Error sending welcome message:', error);
          }
          return;
        }
        
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

          let replyMessage: any; // Can be text message or template

          // Check if there's a pending review (user answering follow-up question)
          const pendingReview = await checkPendingReview(userId);
          if (pendingReview) {
            console.log('[Webhook] Found pending review, processing follow-up answer');
            try {
              const result = await processFollowUpAnswer(userMessage, pendingReview, userId);
              
              if (result.completed) {
                console.log('[Webhook] Review completed successfully');
                // Send confirmation with quick reply
                const { createQuickReply } = await import('@/lib/utils/line-templates');
                replyMessage = createQuickReply(result.response, [
                  { label: '📋 我的食記', text: '我的食記' },
                  { label: '📝 記錄食記', text: '記錄食記' },
                  { label: '🍽️ 餐廳查詢', text: '餐廳查詢' },
                ]);
              } else {
                console.log('[Webhook] Asked follow-up question');
                replyMessage = { type: 'text', text: result.response };
              }
            } catch (error) {
              console.error('[Webhook] Error processing follow-up answer:', error);
              replyMessage = { type: 'text', text: '抱歉，處理你的回答時發生錯誤。請再試一次。' };
            }
          } else {
            // Check if message is a command
            const commandResult = await processCommand(userMessage, userId);
            
            if (commandResult.type === 'command' && commandResult.reply) {
              console.log('[Webhook] Processing command, returning template');
              replyMessage = commandResult.reply;
            } else {
              // Not a command, check if message is a food review
              const isReview = detectReviewIntent(userMessage);
              
              if (isReview) {
                console.log('[Webhook] Detected food review, processing...');
                try {
                  // Extract review information
                  const extracted = await extractReviewInfo(userMessage);
                  extracted.originalMessage = userMessage;
                  
                  // Process review data (detect meal type, infer price, etc.)
                  const reviewTime = new Date();
                  const processed = processReviewData(extracted, reviewTime);
                  
                  // Check what's missing
                  const missingFields: string[] = [];
                  if (processed.needsPriceInfo) missingFields.push('price');
                  if (processed.needsMealTypeInfo) missingFields.push('mealType');
                  
                  if (missingFields.length > 0) {
                    // Save as pending review and ask follow-up question
                    await savePendingReview(userId, processed, missingFields);
                    const followUpText = generateFollowUpQuestion(missingFields, processed);
                    const { createQuickReply } = await import('@/lib/utils/line-templates');
                    replyMessage = createQuickReply(followUpText, [
                      { label: '高', text: '高' },
                      { label: '中', text: '中' },
                      { label: '便宜', text: '便宜' },
                      { label: '早餐', text: '早餐' },
                      { label: '午餐', text: '午餐' },
                      { label: '晚餐', text: '晚餐' },
                    ]);
                    console.log('[Webhook] Asked follow-up question for:', missingFields);
                  } else {
                    // All info complete - save review
                    const review = await saveReview(processed, userId, reviewTime);
                    const confirmationText = formatReviewConfirmation(review);
                    const { createQuickReply } = await import('@/lib/utils/line-templates');
                    replyMessage = createQuickReply(confirmationText, [
                      { label: '📋 我的食記', text: '我的食記' },
                      { label: '📝 記錄食記', text: '記錄食記' },
                      { label: '🍽️ 餐廳查詢', text: '餐廳查詢' },
                    ]);
                    console.log('[Webhook] Review saved successfully');
                  }
                } catch (error) {
                  console.error('[Webhook] Error processing review:', error);
                  replyMessage = { type: 'text', text: '抱歉，處理你的食記時發生錯誤。請再試一次。' };
                }
              } else {
                // Handle as general chat
                console.log('[Webhook] Handling as general chat');
                
                // Get conversation history for context
                let conversationHistory: ChatMessage[] = [];
                try {
                  conversationHistory = await getConversationHistory(userId, 10);
                  console.log(`[Webhook] Retrieved ${conversationHistory.length} messages from conversation history`);
                } catch (dbError) {
                  console.error('[Webhook] Error retrieving conversation history:', dbError);
                  conversationHistory = []; // Use empty history if DB fails
                }

                // If user has no conversation history (first time user), show main menu
                if (conversationHistory.length === 0) {
                  console.log('[Webhook] First-time user, showing main menu');
                  const { createMainMenu } = await import('@/lib/utils/line-templates');
                  replyMessage = createMainMenu();
                } else {
                  // Generate response using OpenAI
                  try {
                    console.log('[Webhook] Calling OpenAI API...');
                    const aiResponse = await generateResponse(userMessage, conversationHistory);
                    console.log(`[Webhook] Generated response: ${aiResponse}`);
                    
                    // Add quick reply options with main menu
                    const { createQuickReply } = await import('@/lib/utils/line-templates');
                    replyMessage = createQuickReply(aiResponse, [
                      { label: '📋 我的食記', text: '我的食記' },
                      { label: '📝 記錄食記', text: '記錄食記' },
                      { label: '🍽️ 餐廳查詢', text: '餐廳查詢' },
                      { label: '📊 統計資訊', text: '統計資訊' },
                      { label: '🌐 查看網站', text: '查看網站' },
                      { label: '❓ 幫助', text: '幫助' },
                    ]);
                  } catch (error) {
                    console.error('[Webhook] Error generating response:', error);
                    
                    // On error, show main menu instead
                    const { createMainMenu } = await import('@/lib/utils/line-templates');
                    replyMessage = createMainMenu();
                  }
                }
              }
            }
          }

          // Save AI response to database (extract text from reply message)
          try {
            const responseText = replyMessage.text || '';
            if (responseText) {
              await addMessage(userId, 'assistant', responseText);
              console.log(`[Webhook] Saved AI response to database`);
            }
          } catch (dbError) {
            console.error('[Webhook] Error saving AI response to database:', dbError);
            // Continue even if DB save fails
          }

          // Reply to the user
          try {
            console.log('[Webhook] Sending reply to LINE...');
            const response: MessageAPIResponseBase = await client.replyMessage(replyToken, replyMessage);
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

