import OpenAI from 'openai';
import { APIError } from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ExtractedReviewInfo {
  restaurantName: string;
  summary: string;
  tags: string[];
  rating: number; // 1-5
  price: '高' | '中' | '便宜' | null;
  priceAmount: number | null;
  mealType: 'breakfast' | 'lunch' | 'dinner' | null;
  needsPriceInfo: boolean;
  needsMealTypeInfo: boolean;
  originalMessage?: string; // Optional: original user message
}

const REVIEW_EXTRACTION_PROMPT = `從餐廳評論提取資訊，回傳JSON。

提取：餐廳名稱(必填)、摘要(50字以內)、標籤(好吃/便宜/服務佳/推薦/CP值高/環境好/微雷/服務差/價格高/不推薦/等太久/普通)、評分(1-5)、價格等級(高/中/便宜/null)、價格金額(數字/null)、餐點類型(breakfast/lunch/dinner/null)。

規則：
- 餐廳名稱必須提取，找不到時用關鍵字推斷
- priceAmount有值時，price必須推斷：<100=便宜, 100-299=中, >=300=高
- needsPriceInfo=true僅當price和priceAmount都為null
- needsMealTypeInfo=true僅當mealType為null

格式：
{"restaurantName":"名稱","summary":"摘要","tags":["標籤"],"rating":4,"price":"便宜"|"中"|"高"|null,"priceAmount":140|null,"mealType":"breakfast"|"lunch"|"dinner"|null,"needsPriceInfo":false,"needsMealTypeInfo":true}

範例：「今天去吃八方雲集，總共140元，鍋貼超好吃」→ {"restaurantName":"八方雲集","summary":"八方雲集鍋貼好吃，價格實惠140元","tags":["好吃","便宜"],"rating":5,"price":"便宜","priceAmount":140,"mealType":null,"needsPriceInfo":false,"needsMealTypeInfo":true}

只回傳JSON，無其他文字。`;

/**
 * Extract review information from user message using OpenAI
 */
export async function extractReviewInfo(message: string): Promise<ExtractedReviewInfo> {
  const model = process.env.OPENAI_MODEL || 'gpt-5-nano';
  const maxTokens = parseInt(process.env.OPENAI_MAX_COMPLETION_TOKENS || '2500', 10);
  
  try {

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: REVIEW_EXTRACTION_PROMPT,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_completion_tokens: maxTokens,
      response_format: { type: 'json_object' },
    });

    // Better error handling for response
    if (!response || !response.choices || response.choices.length === 0) {
      console.error('[Review Extraction] Invalid response structure:', JSON.stringify(response, null, 2));
      throw new Error('Invalid response from OpenAI: no choices returned');
    }

    const firstChoice = response.choices[0];
    const content = firstChoice?.message?.content;
    const finishReason = firstChoice?.finish_reason;

    // Handle case where reasoning model used all tokens for reasoning
    if (!content || content.trim() === '') {
      if (finishReason === 'length') {
        console.warn('[Review Extraction] Model used all tokens for reasoning (finish_reason: length). Using fallback extraction.');
        // Fall through to fallback extraction in catch block
        throw new Error('Token limit reached - using fallback extraction');
      } else {
        console.error('[Review Extraction] No content in response:', {
          finishReason,
          usage: response.usage,
        });
        throw new Error(`No response content from OpenAI. Finish reason: ${finishReason}`);
      }
    }

    // Parse JSON response
    const extracted = JSON.parse(content) as ExtractedReviewInfo;

    // Validate required fields
    if (!extracted.restaurantName || !extracted.summary || !extracted.rating) {
      throw new Error('Invalid extraction: missing required fields');
    }

    // Ensure arrays are arrays
    if (!Array.isArray(extracted.tags)) extracted.tags = [];

    // Validate rating range
    if (extracted.rating < 1 || extracted.rating > 5) {
      extracted.rating = Math.max(1, Math.min(5, extracted.rating));
    }

    // Post-processing validation and fixes
    // Fix restaurant name if it's missing or "未知餐廳"
    if (!extracted.restaurantName || extracted.restaurantName === '未知餐廳' || extracted.restaurantName.trim() === '') {
      // Try multiple patterns to extract restaurant name
      const patterns = [
        /(?:去|吃了?|在)(.{1,20}?)(?:餐廳|店|館|吃|用餐|，|,|。|$|的)/,
        /(.{1,20}?)(?:的|餐廳|店|館)(?:服務|食物|餐點|不錯|好吃|很)/,
        /(.{1,20}?)(?:吃|用餐|點餐)/,
        /(?:在|到)(.{1,20}?)(?:吃|用餐|點餐|，|,|。|$)/,
      ];
      
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          const candidate = match[1].trim();
          // Validate: should be 2-20 characters, not just numbers or common words
          if (candidate.length >= 2 && candidate.length <= 20 && 
              !/^[\d\s，,。.]+$/.test(candidate) &&
              !['今天', '昨天', '明天', '剛剛', '剛才', '總共', '價格', '便宜', '貴'].includes(candidate)) {
            extracted.restaurantName = candidate;
            console.log(`[Review Extraction] Extracted restaurant name from fallback: ${candidate}`);
            break;
          }
        }
      }
      
      // If still not found, try to extract from common restaurant keywords
      if (!extracted.restaurantName || extracted.restaurantName === '未知餐廳') {
        const restaurantKeywords = ['八方雲集', '鼎泰豐', '麥當勞', '肯德基', '星巴克', '五九麵館', '王品', '瓦城'];
        for (const keyword of restaurantKeywords) {
          if (message.includes(keyword)) {
            extracted.restaurantName = keyword;
            console.log(`[Review Extraction] Extracted restaurant name from keyword: ${keyword}`);
            break;
          }
        }
      }
      
      // Last resort: use first few meaningful words
      if (!extracted.restaurantName || extracted.restaurantName === '未知餐廳') {
        const words = message.split(/[，,。.\s]+/).filter(w => w.length > 1 && w.length < 15);
        if (words.length > 0) {
          extracted.restaurantName = words[0];
          console.log(`[Review Extraction] Using first word as restaurant name: ${words[0]}`);
        }
      }
    }

    // Ensure price is set if priceAmount exists
    if (extracted.priceAmount && extracted.priceAmount > 0 && !extracted.price) {
      if (extracted.priceAmount < 100) extracted.price = '便宜';
      else if (extracted.priceAmount < 300) extracted.price = '中';
      else extracted.price = '高';
      extracted.needsPriceInfo = false; // We have price info now
    }

    return extracted;
  } catch (error) {
    // Check if this is a token limit error - use fallback extraction
    const isTokenLimitError = 
      error instanceof Error && 
      error.message.includes('Token limit reached');
    
    if (isTokenLimitError) {
      console.log('[Review Extraction] Using fallback extraction due to token limit');
      // Continue to fallback extraction below
    } else {
      console.error('[Review Extraction] Error:', error);
      console.error('[Review Extraction] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
      });
    }
    
    if (error instanceof APIError) {
      console.error('[Review Extraction] OpenAI API Error:', {
        status: error.status,
        code: error.code,
        message: error.message,
        type: error.type,
      });
      
      if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      }
      if (error.status === 401) {
        throw new Error('OpenAI API key is invalid.');
      }
      if (error.status === 400) {
        throw new Error(`OpenAI API bad request: ${error.message}. This might be due to unsupported model or parameters.`);
      }
      if (error.status === 404) {
        throw new Error(`OpenAI API model not found: ${model}. Please check if the model name is correct.`);
      }
      
      // Re-throw with more context
      throw new Error(`OpenAI API error (${error.status}): ${error.message}`);
    }

    // Fallback: try to extract basic info manually
    // Try to extract restaurant name from common patterns
    let restaurantName = '未知餐廳';
    const restaurantPatterns = [
      /(?:去|吃了?|在)(.{0,10}?)(?:餐廳|店|館|吃|用餐)/,
      /(.{0,10}?)(?:的|餐廳|店|館)/,
    ];
    for (const pattern of restaurantPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        restaurantName = match[1].trim();
        if (restaurantName.length > 1 && restaurantName.length < 20) {
          break;
        }
      }
    }

    return {
      restaurantName,
      summary: message.substring(0, 100),
      tags: [],
      rating: 3,
      price: null,
      priceAmount: null,
      mealType: null,
      needsPriceInfo: true,
      needsMealTypeInfo: true,
      originalMessage: message,
    };
  }
}

