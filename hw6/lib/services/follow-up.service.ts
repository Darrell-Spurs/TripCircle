import PendingReview, { IPendingReview } from '../models/PendingReview';
import { ExtractedReviewInfo } from './review-extraction.service';
import { saveReview, detectMealTypeByTime } from './review-processing.service';

/**
 * Check for pending review for a user
 */
export async function checkPendingReview(userId: string): Promise<IPendingReview | null> {
  return await PendingReview.findOne({ userId, expiresAt: { $gt: new Date() } });
}

/**
 * Process follow-up answer and complete or ask next question
 */
export async function processFollowUpAnswer(
  message: string,
  pendingReview: IPendingReview,
  userId: string
): Promise<{ response: string; completed: boolean }> {
  const extracted = pendingReview.extractedData as ExtractedReviewInfo;
  const missingFields = pendingReview.missingFields;

  // Process the answer
  const answer = message.trim().toLowerCase();

  // Check if answering price question
  if (missingFields.includes('price')) {
    if (answer.includes('高') || answer.includes('貴') || answer.includes('expensive')) {
      extracted.price = '高';
    } else if (answer.includes('中') || answer.includes('medium') || answer.includes('普通')) {
      extracted.price = '中';
    } else if (answer.includes('便宜') || answer.includes('cheap') || answer.includes('划算')) {
      extracted.price = '便宜';
    } else {
      // Try to extract number
      const amountMatch = answer.match(/(\d+)/);
      if (amountMatch) {
        const amount = parseInt(amountMatch[1], 10);
        extracted.priceAmount = amount;
        if (amount < 100) extracted.price = '便宜';
        else if (amount < 300) extracted.price = '中';
        else extracted.price = '高';
      } else {
        return {
          response: '抱歉，我沒理解你的回答。請回答：高、中、或便宜',
          completed: false,
        };
      }
    }

    // Remove price from missing fields
    const newMissingFields = missingFields.filter((f) => f !== 'price');
    extracted.needsPriceInfo = false;

    // If no more missing fields, save review
    if (newMissingFields.length === 0) {
      await PendingReview.deleteOne({ userId });
      const review = await saveReview(extracted, userId, new Date());
      return {
        response: formatReviewConfirmation(review),
        completed: true,
      };
    }

    // Update pending review and ask next question
    pendingReview.missingFields = newMissingFields;
    // Ensure originalMessage is set
    pendingReview.extractedData = {
      ...extracted,
      originalMessage: extracted.originalMessage || '',
    };
    await pendingReview.save();

    return {
      response: generateFollowUpQuestion(newMissingFields, extracted),
      completed: false,
    };
  }

  // Check if answering meal type question
  if (missingFields.includes('mealType')) {
    // Check if it's a confirmation (是/yes/對/對的)
    const isConfirmation = answer.includes('是') || 
                           answer.includes('yes') || 
                           answer.includes('對') || 
                           answer.includes('對的') ||
                           answer === 'y' ||
                           answer === 'ok' ||
                           answer === 'okay';
    
    if (isConfirmation) {
      // Use the suggested meal type from the question
      // The suggested meal type is already in extracted.mealType from time detection
      if (!extracted.mealType) {
        // Fallback: use time-based detection
        extracted.mealType = detectMealTypeByTime(new Date());
      }
    } else if (answer.includes('早餐') || answer.includes('breakfast') || answer.includes('早上')) {
      extracted.mealType = 'breakfast';
    } else if (answer.includes('午餐') || answer.includes('lunch') || answer.includes('中午')) {
      extracted.mealType = 'lunch';
    } else if (answer.includes('晚餐') || answer.includes('dinner') || answer.includes('晚上')) {
      extracted.mealType = 'dinner';
    } else {
      return {
        response: '抱歉，我沒理解你的回答。請回答：是、早餐、午餐、或晚餐',
        completed: false,
      };
    }

    // Remove mealType from missing fields
    const newMissingFields = missingFields.filter((f) => f !== 'mealType');
    extracted.needsMealTypeInfo = false;

    // If no more missing fields, save review
    if (newMissingFields.length === 0) {
      await PendingReview.deleteOne({ userId });
      const review = await saveReview(extracted, userId, new Date());
      return {
        response: formatReviewConfirmation(review),
        completed: true,
      };
    }

    // Update pending review and ask next question
    pendingReview.missingFields = newMissingFields;
    // Ensure originalMessage is set
    pendingReview.extractedData = {
      ...extracted,
      originalMessage: extracted.originalMessage || '',
    };
    await pendingReview.save();

    return {
      response: generateFollowUpQuestion(newMissingFields, extracted),
      completed: false,
    };
  }

  // Should not reach here, but just in case
  await PendingReview.deleteOne({ userId });
  const review = await saveReview(extracted, userId, new Date());
  return {
    response: formatReviewConfirmation(review),
    completed: true,
  };
}

/**
 * Generate follow-up question for missing fields
 */
export function generateFollowUpQuestion(
  missingFields: string[],
  extracted: ExtractedReviewInfo
): string {
  const questions: string[] = [];

  if (missingFields.includes('price')) {
    questions.push('請問這家餐廳的價格如何？(高/中/便宜)');
  }

  if (missingFields.includes('mealType')) {
    const suggested = extracted.mealType;
    const mealTypeName =
      suggested === 'breakfast' ? '早餐' : suggested === 'lunch' ? '午餐' : '晚餐';
    questions.push(`請問這是${mealTypeName}嗎？(早餐/午餐/晚餐)`);
  }

  return questions.join('\n');
}

/**
 * Save pending review
 */
export async function savePendingReview(
  userId: string,
  extracted: ExtractedReviewInfo,
  missingFields: string[]
): Promise<void> {
  // Delete any existing pending review for this user
  await PendingReview.deleteOne({ userId });

  // Create new pending review
  const pendingReview = new PendingReview({
    userId,
    extractedData: {
      ...extracted,
      originalMessage: extracted.originalMessage || '',
    },
    missingFields,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  await pendingReview.save();
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
  if (review.tags.length > 0) {
    message += `🏷️ 標籤：${review.tags.join('、')}\n`;
  }
  message += `\n📝 ${review.aiSummary}\n\n`;
  message += `感謝分享！`;

  return message;
}

