/**
 * Command handler for LINE Bot
 * 調用資料庫服務獲取真實數據
 */

import {
  createMainMenu,
  createHelpMessage,
  createReviewListCarousel,
  createRestaurantInfoButtons,
  createRestaurantNotFound,
  createRestaurantQueryPrompt,
  createOtherReviewsCarousel,
  createStatisticsMessage,
  createRecordReviewPrompt,
  createWebsiteLinkButtons,
  isCommand,
  extractRestaurantName,
} from '@/lib/utils/line-templates';
import {
  getUserReviews,
  getRestaurantByName,
  getRestaurantReviews,
  getStatistics,
} from '@/lib/services/data.service';
import { TextMessage, TemplateMessage } from '@line/bot-sdk';

export type CommandReply = TextMessage | TemplateMessage | (TextMessage & { quickReply?: any });

/**
 * Process command and return appropriate template with real data
 */
export async function processCommand(
  message: string,
  userId: string
): Promise<{ type: 'command' | 'review' | 'chat'; reply?: CommandReply }> {
  const lowerMessage = message.toLowerCase().trim();

  // Help command
  if (lowerMessage.includes('幫助') || lowerMessage.includes('help')) {
    return { type: 'command', reply: createHelpMessage() };
  }

  // Main menu
  if (lowerMessage.includes('主選單') || lowerMessage.includes('menu')) {
    return { type: 'command', reply: createMainMenu() };
  }

  // My reviews
  if (lowerMessage.includes('我的食記')) {
    try {
      const reviews = await getUserReviews(userId, 10);
      return { type: 'command', reply: createReviewListCarousel(reviews) };
    } catch (error) {
      console.error('[Command Handler] Error fetching user reviews:', error);
      return { type: 'command', reply: createReviewListCarousel([]) };
    }
  }

  // Restaurant query
  if (lowerMessage.includes('餐廳查詢') || lowerMessage.includes('查詢餐廳')) {
    const restaurantName = extractRestaurantName(message);
    if (restaurantName) {
      try {
        const restaurant = await getRestaurantByName(restaurantName);
        if (restaurant) {
          return { type: 'command', reply: createRestaurantInfoButtons(restaurant) };
        } else {
          return { type: 'command', reply: createRestaurantNotFound(restaurantName) };
        }
      } catch (error) {
        console.error('[Command Handler] Error fetching restaurant:', error);
        return { type: 'command', reply: createRestaurantNotFound(restaurantName) };
      }
    } else {
      return { type: 'command', reply: createRestaurantQueryPrompt() };
    }
  }

  // View restaurant details (詳情/詳細)
  if ((lowerMessage.includes('的詳情') || lowerMessage.includes('的詳細')) && !lowerMessage.includes('我的')) {
    const restaurantName = extractRestaurantName(message);
    if (restaurantName) {
      try {
        const restaurant = await getRestaurantByName(restaurantName);
        if (restaurant) {
          return { type: 'command', reply: createRestaurantInfoButtons(restaurant) };
        } else {
          return { type: 'command', reply: createRestaurantNotFound(restaurantName) };
        }
      } catch (error) {
        console.error('[Command Handler] Error fetching restaurant:', error);
        return { type: 'command', reply: createRestaurantNotFound(restaurantName) };
      }
    }
  }

  // View restaurant reviews
  if (lowerMessage.includes('的評論') && !lowerMessage.includes('的詳情') && !lowerMessage.includes('的詳細')) {
    const restaurantName = extractRestaurantName(message);
    if (restaurantName) {
      try {
        const reviews = await getRestaurantReviews(restaurantName, 10);
        return { type: 'command', reply: createOtherReviewsCarousel(reviews) };
      } catch (error) {
        console.error('[Command Handler] Error fetching restaurant reviews:', error);
        return { type: 'command', reply: createOtherReviewsCarousel([]) };
      }
    }
  }


  // Statistics
  if (lowerMessage.includes('統計資訊') || lowerMessage.includes('統計')) {
    try {
      const stats = await getStatistics();
      return { type: 'command', reply: createStatisticsMessage(stats) };
    } catch (error) {
      console.error('[Command Handler] Error fetching statistics:', error);
      // Return empty stats on error
      return {
        type: 'command',
        reply: createStatisticsMessage({
          totalReviews: 0,
          totalRestaurants: 0,
          averageRating: 0,
          topTags: [],
          topRestaurants: [],
        }),
      };
    }
  }

  // Record review command (just a prompt)
  if (lowerMessage.includes('記錄食記')) {
    return { type: 'command', reply: createRecordReviewPrompt() };
  }

  // View website
  if (lowerMessage.includes('查看網站') || lowerMessage.includes('網站')) {
    return { type: 'command', reply: createWebsiteLinkButtons() };
  }

  // Not a command
  return { type: 'chat' };
}

