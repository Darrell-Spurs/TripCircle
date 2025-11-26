/**
 * LINE message templates for food review responses
 */

/**
 * Format review confirmation message for LINE
 */
export function formatReviewConfirmation(review: {
  restaurantName: string;
  aiSummary: string;
  tags: string[];
  rating: number;
  price: string | null;
  mealType: string | null;
}): string {
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

/**
 * Generate follow-up question for price
 */
export function generatePriceQuestion(): string {
  return '感謝你的分享！請問這家餐廳的價格如何？(高/中/便宜)';
}

/**
 * Generate follow-up question for meal type
 */
export function generateMealTypeQuestion(suggestedMealType: 'breakfast' | 'lunch' | 'dinner'): string {
  const mealTypeName =
    suggestedMealType === 'breakfast' ? '早餐' : suggestedMealType === 'lunch' ? '午餐' : '晚餐';
  return `感謝你的分享！請問這是${mealTypeName}嗎？(早餐/午餐/晚餐)`;
}

/**
 * Generate welcome message for new users
 */
export function generateWelcomeMessage(): string {
  return `🍽️ 歡迎使用 Food Tracker Bot！

我可以幫你記錄餐廳食記，只需要告訴我你的用餐體驗，例如：

「今天去吃八方雲集，鍋貼超好吃」
「昨天去了鼎泰豐，小籠包不錯但有點貴」

我會自動整理成食記，並詢問價格和餐點類型。

開始分享你的美食體驗吧！`;
}

/**
 * Generate help message
 */
export function generateHelpMessage(): string {
  return `📖 使用說明

1. 直接分享你的用餐體驗，例如：
   「今天吃了五九麵館，總共140元」
   「昨天去了鼎泰豐，小籠包不錯但有點貴」

2. 我會自動提取餐廳名稱、評價、標籤等資訊

3. 如果缺少價格或餐點類型，我會詢問你

4. 完成後會顯示整理好的食記

開始分享吧！`;
}

