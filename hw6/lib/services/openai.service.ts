import OpenAI from 'openai';
import { APIError } from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRateLimit?: boolean,
    public isQuotaExceeded?: boolean
  ) {
    super(message);
    this.name = 'OpenAIError';
  }
}

/**
 * Generate a response from OpenAI based on the user's message
 * @param userMessage - The message from the LINE user
 * @param conversationHistory - Optional conversation history for context
 * @returns The generated response text
 * @throws OpenAIError with appropriate error information
 */
export async function generateResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  try {
    const systemPrompt = process.env.OPENAI_SYSTEM_PROMPT || 
      'You are a Food Tracker assistant bot (食記助手). Your main purpose is to help users record food reviews in Traditional Chinese. When users speak in English or other languages, politely redirect them to use Traditional Chinese and explain that this bot is designed for recording restaurant reviews. Always respond in Traditional Chinese. Keep responses concise and friendly.';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const model = process.env.OPENAI_MODEL || 'gpt-5-nano';
    const maxTokens = parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '2500', 10);

    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      max_completion_tokens: maxTokens,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new OpenAIError('No response generated from OpenAI');
    }

    return response;
  } catch (error) {
    console.error('[OpenAI] API error:', error);

    // Handle OpenAI API errors
    if (error instanceof APIError) {
      const statusCode = error.status;
      
      // Rate limit error (429)
      if (statusCode === 429) {
        console.error('[OpenAI] Rate limit exceeded');
        throw new OpenAIError(
          'I\'m receiving too many requests right now. Please try again in a moment.',
          statusCode,
          true,
          false
        );
      }

      // Quota exceeded (insufficient_quota)
      if (statusCode === 402 || error.code === 'insufficient_quota') {
        console.error('[OpenAI] Quota exceeded');
        throw new OpenAIError(
          'Service quota has been exceeded. Please contact support.',
          statusCode,
          false,
          true
        );
      }

      // Invalid API key (401)
      if (statusCode === 401) {
        console.error('[OpenAI] Invalid API key');
        throw new OpenAIError(
          'API authentication failed. Please check configuration.',
          statusCode,
          false,
          false
        );
      }

      // Server error (500-599)
      if (statusCode >= 500) {
        console.error('[OpenAI] Server error:', statusCode);
        throw new OpenAIError(
          'The AI service is temporarily unavailable. Please try again later.',
          statusCode,
          false,
          false
        );
      }

      // Other API errors
      throw new OpenAIError(
        error.message || 'An error occurred while processing your request.',
        statusCode,
        false,
        false
      );
    }

    // Handle network errors
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
        throw new OpenAIError(
          'Unable to connect to AI service. Please check your internet connection.',
          undefined,
          false,
          false
        );
      }
    }

    // Generic error
    throw new OpenAIError(
      'An unexpected error occurred while processing your message.',
      undefined,
      false,
      false
    );
  }
}

/**
 * Get a user-friendly error message for OpenAI errors
 */
export function getErrorMessage(error: OpenAIError): string {
  if (error.isRateLimit) {
    return 'I\'m receiving too many requests right now. Please wait a moment and try again.';
  }
  
  if (error.isQuotaExceeded) {
    return 'I\'m temporarily unavailable due to service limits. Please try again later.';
  }

  return error.message || 'Sorry, I encountered an error while processing your message. Please try again later.';
}

