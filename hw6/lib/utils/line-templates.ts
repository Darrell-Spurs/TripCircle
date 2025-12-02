/**
 * LINE message templates and reply templates
 * 僅包含 UI 模板，不包含 API 調用
 */

import {
  TextMessage,
  QuickReply,
  TemplateMessage,
  URIAction,
  MessageAction,
  PostbackAction,
} from '@line/bot-sdk';

/**
 * Create a Quick Reply template
 */
export function createQuickReply(
  text: string,
  items: Array<{ label: string; text: string }>
): TextMessage & { quickReply?: QuickReply } {
  return {
    type: 'text',
    text,
    quickReply: {
      items: items.map((item) => ({
        type: 'action',
        action: {
          type: 'message',
          label: item.label,
          text: item.text,
        },
      })),
    },
  };
}

/**
 * Create a Buttons template
 * LINE API 限制：
 * - title: 最多 40 字元
 * - text: 最多 120 字元
 * - actions: 最多 4 個按鈕
 */
export function createButtonsTemplate(
  altText: string,
  title: string,
  text: string,
  actions: Array<URIAction | MessageAction | PostbackAction>,
  thumbnailImageUrl?: string
): TemplateMessage {
  // 確保符合 LINE API 限制
  const trimmedTitle = title.substring(0, 40);
  const trimmedText = text.substring(0, 120);
  const trimmedActions = actions.slice(0, 4).map((action) => {
    // 確保每個 action 的 label 和 text 符合限制
    if (action.type === 'message') {
      const messageAction = action as any; // 使用 any 避免類型錯誤
      return {
        ...messageAction,
        label: messageAction.label ? String(messageAction.label).substring(0, 20) : messageAction.label, // label 最多 20 字元
        text: String(messageAction.text).substring(0, 300), // text 最多 300 字元
      };
    }
    return action;
  });

  return {
    type: 'template',
    altText: altText.substring(0, 400), // altText 最多 400 字元
    template: {
      type: 'buttons',
      title: trimmedTitle,
      text: trimmedText,
      actions: trimmedActions,
      ...(thumbnailImageUrl && { thumbnailImageUrl }),
    },
  };
}

/**
 * Create a Carousel template
 * LINE API 限制：
 * - columns: 最多 10 個
 * - title: 最多 40 字元
 * - text: 最多 120 字元
 * - actions: 最多 3 個
 */
export function createCarouselTemplate(
  altText: string,
  columns: Array<{
    title: string;
    text: string;
    actions: Array<URIAction | MessageAction | PostbackAction>;
    thumbnailImageUrl?: string;
  }>
): TemplateMessage {
  return {
    type: 'template',
    altText: altText.substring(0, 400), // altText 最多 400 字元
    template: {
      type: 'carousel',
      columns: columns.slice(0, 10).map( // 最多 10 個 columns
        (col) => {
          // 驗證和清理 actions，確保格式正確，所有 action 都必須有 label
          const cleanedActions = col.actions.slice(0, 3).map((action) => {
            if (action.type === 'message') {
              const messageAction = action as any;
              // 確保 label 拼寫正確，並清理屬性
              return {
                type: 'message' as const,
                label: messageAction.label || messageAction.labbel || '', // 處理可能的拼寫錯誤
                text: String(messageAction.text || '').substring(0, 300),
              };
            } else if (action.type === 'uri') {
              const uriAction = action as URIAction;
              return {
                type: 'uri' as const,
                label: (uriAction as any).label || '',
                uri: uriAction.uri,
              };
            } else if (action.type === 'postback') {
              const postbackAction = action as PostbackAction;
              return {
                type: 'postback' as const,
                label: (postbackAction as any).label || '',
                data: postbackAction.data,
                ...(postbackAction.displayText && { displayText: postbackAction.displayText }),
              };
            }
            // Fallback: ensure label exists (should not reach here, but handle gracefully)
            const fallbackAction = action as any;
            return {
              type: fallbackAction.type || 'message',
              label: fallbackAction.label || '',
              ...(fallbackAction.text && { text: fallbackAction.text }),
              ...(fallbackAction.uri && { uri: fallbackAction.uri }),
              ...(fallbackAction.data && { data: fallbackAction.data }),
              ...(fallbackAction.displayText && { displayText: fallbackAction.displayText }),
            };
          }) as Array<(MessageAction | URIAction | PostbackAction) & { label: string }>;
          
          return {
            title: col.title.substring(0, 40), // title 最多 40 字元
            text: col.text.substring(0, 100), // text 最多 100 字元
            actions: cleanedActions,
            ...(col.thumbnailImageUrl && { thumbnailImageUrl: col.thumbnailImageUrl }),
          };
        }
      ),
    },
  };
}

/**
 * Create main menu with Quick Reply
 */
/**
 * Get website URL based on environment
 */
function getWebsiteUrl(): string {
  // Priority 1: Check for custom production URL (user-defined, takes precedence)
  if (process.env.NEXT_PUBLIC_WEBSITE_URL) {
    return process.env.NEXT_PUBLIC_WEBSITE_URL;
  }
  // Priority 2: Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  // Priority 3: Use default production URL (custom domain)
  // Note: We don't use VERCEL_URL here because Vercel auto-generates it
  // and it might not be the custom domain you want
  return 'https://wp1141-kappa-nine.vercel.app';
}

/**
 * Create website link buttons template
 */
export function createWebsiteLinkButtons(): TemplateMessage {
  const websiteUrl = getWebsiteUrl();
  
  return createButtonsTemplate(
    '查看網站',
    '🌐 查看網站',
    '點擊下方按鈕前往網站查看詳細資訊',
    [
      {
        type: 'uri',
        label: '🌐 前往網站',
        uri: websiteUrl,
      } as URIAction,
      {
        type: 'message',
        label: '🔙 主選單',
        text: '主選單',
      } as MessageAction,
    ]
  );
}

/**
 * Create main menu with Quick Reply
 */
export function createMainMenu(customText?: string): TextMessage & { quickReply?: QuickReply } {
  const menuText = customText || `🍽️ Food Tracker Bot 主選單

我可以幫你：
• 📝 記錄餐廳食記
• 📋 查看你的食記
• 🍽️ 查詢餐廳資訊
• 📊 查看統計資訊
• 🌐 查看網站

請選擇功能或直接分享你的用餐體驗！`;
  
  return createQuickReply(menuText, [
    { label: '📝 記錄食記', text: '記錄食記' },
    { label: '📋 我的食記', text: '我的食記' },
    { label: '🍽️ 餐廳查詢', text: '餐廳查詢' },
    { label: '📊 統計資訊', text: '統計資訊' },
    { label: '🌐 查看網站', text: '查看網站' },
    { label: '❓ 幫助', text: '幫助' },
  ]);
}

/**
 * Create welcome message with menu
 */
export function createWelcomeMessage(): TextMessage & { quickReply?: QuickReply } {
  return createQuickReply(
    `🍽️ 歡迎使用 Food Tracker Bot！

我可以幫你：
• 記錄餐廳食記
• 查看你的食記
• 查詢餐廳資訊
• 查看其他人的評論
• 查看統計資訊

請選擇功能或直接分享你的用餐體驗！`,
    [
      { label: '📝 記錄食記', text: '記錄食記' },
      { label: '📋 我的食記', text: '我的食記' },
      { label: '🍽️ 餐廳查詢', text: '餐廳查詢' },
      { label: '❓ 幫助', text: '幫助' },
    ]
  );
}

/**
 * Create help message with buttons
 */
export function createHelpMessage(): TemplateMessage {
  // LINE Buttons Template 限制：text 最多 120 字元
  // 簡化說明文字
  const text = `1️⃣記錄食記\n2️⃣查看食記\n3️⃣查詢餐廳\n4️⃣觀看評論\n5️⃣統計資訊`;

  return createButtonsTemplate(
    '使用說明',
    '📖 使用說明',
    text,
    [
      {
        type: 'message',
        label: '📝 開始記錄',
        text: '記錄食記',
      } as MessageAction,
      {
        type: 'message',
        label: '📋 我的食記',
        text: '我的食記',
      } as MessageAction,
      {
        type: 'message',
        label: '🔙 主選單',
        text: '主選單',
      } as MessageAction,
    ]
  );
}

/**
 * Create review list carousel
 */
export function createReviewListCarousel(
  reviews: Array<{
    id: string;
    restaurantName: string;
    rating: number;
    summary: string;
    tags: string[];
    price: string | null;
    mealType: string | null;
    createdAt: Date;
  }>
): TemplateMessage | (TextMessage & { quickReply?: QuickReply }) {
  if (reviews.length === 0) {
    return createEmptyReviewList();
  }

  const columns = reviews.slice(0, 10).map((review) => {
    const priceText = review.price || '未設定';
    const mealTypeText =
      review.mealType === 'breakfast'
        ? '早餐'
        : review.mealType === 'lunch'
          ? '午餐'
          : review.mealType === 'dinner'
            ? '晚餐'
            : '未設定';
    const tagsText = review.tags.length > 0 ? review.tags.slice(0, 3).join('、') : '無';
    const date = new Date(review.createdAt).toLocaleDateString('zh-TW');

    // 構建基礎文字（評分、價格、餐點類型、標籤、日期）
    // 使用更簡潔的格式以節省空間
    const baseText = `⭐${review.rating}/5 💰${priceText} 🍴${mealTypeText}\n🏷️${tagsText}\n📅${date}\n`;
    
    // 計算可用於 summary 的空間
    // 考慮 emoji 可能被計算為多個字符，使用更保守的估計
    // baseText 大約 30-40 字符（含 emoji），預留 10 字符安全邊距
    const estimatedBaseLength = 50; // 保守估計
    const maxSummaryLength = Math.max(0, 120 - estimatedBaseLength - 5); // 預留 5 字符給 "..."
    
    // 截斷 summary 以符合總長度限制
    let summary = review.summary;
    if (summary.length > maxSummaryLength) {
      summary = summary.substring(0, maxSummaryLength) + '...';
    }
    
    // const fullText = baseText + summary;
    const fullText = baseText;
    
    // 最終確保不超過 100 字符（更保守，考慮 emoji 計數差異）
    // createCarouselTemplate 會再次截斷到 100，這裡先截斷到 100 確保安全
    const finalText = fullText.length > 100 ? fullText.substring(0, 97) + '...' : fullText;

    return {
      title: review.restaurantName.length > 40 ? review.restaurantName.substring(0, 37) + '...' : review.restaurantName,
      text: finalText,
      actions: [
        {
          type: 'message',
          label: '查看餐廳詳情',
          text: `查看 ${review.restaurantName} 的詳情`,
        } as MessageAction,
        {
          type: 'message',
          label: '🔙 主選單',
          text: '主選單',
        } as MessageAction,
      ],
    };
  });

  return createCarouselTemplate('我的食記', columns);
}

/**
 * Create empty review list message
 */
export function createEmptyReviewList(): TextMessage & { quickReply?: QuickReply } {
  return createQuickReply(
    '📋 你還沒有記錄任何食記。\n\n直接分享你的用餐體驗就可以開始記錄了！',
    [
      { label: '📝 記錄食記', text: '記錄食記' },
      { label: '❓ 幫助', text: '幫助' },
      { label: '🔙 主選單', text: '主選單' },
    ]
  );
}

/**
 * Create restaurant info buttons
 */
export function createRestaurantInfoButtons(restaurant: {
  name: string;
  totalReviews: number;
  averageRating: number;
  tagCounts: { [key: string]: number };
  priceRange: { high: number; medium: number; low: number };
  mealTypeDistribution: { breakfast: number; lunch: number; dinner: number };
}): TemplateMessage {
  const topTags = Object.entries(restaurant.tagCounts || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([tag]) => tag);

  // LINE Buttons Template 限制：
  // - title: 最多 40 字元
  // - text: 最多 120 字元
  // 縮短文字內容以符合限制
  
  // 確保 title 不超過 40 字元
  const title = `🍽️ ${restaurant.name}`.substring(0, 40);
  
  // 構建清晰的 text，確保不超過 120 字元
  // 使用更緊湊的格式以節省空間
  const tagsText = topTags.length > 0 ? topTags.join('、') : '無';
  
  // 直接使用最緊湊的格式，避免超過 120 字元
  // 格式：⭐X.X/5 📝X則評論 💰高:X中:X低:X 🍴早:X午:X晚:X 🏷️標籤
  let text = `⭐${restaurant.averageRating.toFixed(1)}/5 📝${restaurant.totalReviews}則評論\n💰高:${restaurant.priceRange.high} 中:${restaurant.priceRange.medium} 低:${restaurant.priceRange.low}\n🍴早:${restaurant.mealTypeDistribution.breakfast} 午:${restaurant.mealTypeDistribution.lunch} 晚:${restaurant.mealTypeDistribution.dinner}\n🏷️${tagsText}`;
  
  // 確保不超過 120 字元（考慮 emoji 可能被計算為多個字符）
  if (text.length > 120) {
    // 如果太長，截斷標籤
    const maxTagLength = Math.max(0, 120 - text.length + tagsText.length - 10); // 預留 10 字符安全邊距
    const shortTags = tagsText.length > maxTagLength 
      ? tagsText.substring(0, maxTagLength) + '...'
      : tagsText;
    text = `⭐${restaurant.averageRating.toFixed(1)}/5 📝${restaurant.totalReviews}則評論\n💰高:${restaurant.priceRange.high} 中:${restaurant.priceRange.medium} 低:${restaurant.priceRange.low}\n🍴早:${restaurant.mealTypeDistribution.breakfast} 午:${restaurant.mealTypeDistribution.lunch} 晚:${restaurant.mealTypeDistribution.dinner}\n🏷️${shortTags}`;
    
    // 最終確保不超過 120 字元
    if (text.length > 120) {
      text = text.substring(0, 117) + '...';
    }
  }

  return createButtonsTemplate(
    `餐廳：${restaurant.name}`,
    title,
    text,
    [
      {
        type: 'message',
        label: '🍱回到我的食記',
        text: '我的食記',
      } as MessageAction,
      {
        type: 'message',
        label: '🔙 主選單',
        text: '主選單',
      } as MessageAction,
    ]
  );
}

/**
 * Create restaurant not found message
 */
export function createRestaurantNotFound(restaurantName: string): TextMessage & { quickReply?: QuickReply } {
  return createQuickReply(
    `找不到餐廳「${restaurantName}」。\n\n請確認餐廳名稱是否正確，或使用「餐廳查詢」功能查看所有餐廳。`,
    [
      { label: '🍽️ 餐廳查詢', text: '餐廳查詢' },
      { label: '📋 我的食記', text: '我的食記' },
      { label: '🔙 主選單', text: '主選單' },
    ]
  );
}

/**
 * Create restaurant query prompt
 */
export function createRestaurantQueryPrompt(): TextMessage & { quickReply?: QuickReply } {
  return createQuickReply(
    '請告訴我要查詢的餐廳名稱，例如：「餐廳查詢 八方雲集」',
    [
      { label: '🔙 主選單', text: '主選單' },
      { label: '📋 我的食記', text: '我的食記' },
    ]
  );
}

/**
 * Create other users' reviews carousel
 */
export function createOtherReviewsCarousel(
  reviews: Array<{
    id: string;
    restaurantName: string;
    rating: number;
    summary: string;
    tags: string[];
    price: string | null;
    mealType: string | null;
    createdAt: Date;
  }>
): TemplateMessage | (TextMessage & { quickReply?: QuickReply }) {
  if (reviews.length === 0) {
    return createEmptyOtherReviews();
  }

  const columns = reviews.slice(0, 10).map((review) => {
    const priceText = review.price || '未設定';
    const date = new Date(review.createdAt).toLocaleDateString('zh-TW');

    // 構建基礎文字（評分、價格、日期）
    const baseText = `⭐ ${review.rating}/5 | 💰 ${priceText}\n📅 ${date}\n\n`;
    
    // 計算可用於 summary 的空間（120 字元 - baseText 長度 - 3 字元預留給 "..."）
    const baseTextLength = baseText.length;
    const maxSummaryLength = Math.max(0, 120 - baseTextLength - 3);
    
    // 截斷 summary 以符合總長度限制
    let summary = review.summary;
    if (summary.length > maxSummaryLength) {
      summary = summary.substring(0, maxSummaryLength) + '...';
    }
    
    const fullText = baseText + summary;
    
    // 最終確保不超過 100 字符（更保守，考慮 emoji 計數差異）
    // createCarouselTemplate 會再次截斷到 100，這裡先截斷到 100 確保安全
    const finalText = fullText.length > 100 ? fullText.substring(0, 97) + '...' : fullText;

    return {
      title: review.restaurantName.length > 40 ? review.restaurantName.substring(0, 37) + '...' : review.restaurantName,
      text: finalText,
      actions: [
        {
          type: 'message',
          label: '查看餐廳詳情',
          text: `查看 ${review.restaurantName} 的詳情`,
        } as MessageAction,
      ],
    };
  });

  return createCarouselTemplate('其他人的評論', columns);
}

/**
 * Create empty other reviews message
 */
export function createEmptyOtherReviews(): TextMessage & { quickReply?: QuickReply } {
  return createQuickReply(
    '📋 目前沒有其他用戶的評論。',
    [
      { label: '📝 記錄食記', text: '記錄食記' },
      { label: '📋 我的食記', text: '我的食記' },
      { label: '🔙 主選單', text: '主選單' },
    ]
  );
}

/**
 * Create statistics message
 */
export function createStatisticsMessage(stats: {
  totalReviews: number;
  totalRestaurants: number;
  averageRating: number;
  topTags: Array<{ tag: string; count: number }>;
  topRestaurants: Array<{ name: string; reviews: number; rating: number }>;
}): TemplateMessage {
  // LINE Buttons Template 限制：text 最多 120 字元
  // 簡化內容以符合限制
  const topTagsText = stats.topTags.slice(0, 3).map((t) => `${t.tag}(${t.count})`).join(' ');
  const topRestaurantsText = stats.topRestaurants.slice(0, 2).map((r) => `${r.name}(${r.reviews})`).join(' ');

  // 構建簡化的 text
  let text = `📝${stats.totalReviews} 🍽️${stats.totalRestaurants}\n⭐${stats.averageRating.toFixed(1)}/5\n🏷️${topTagsText || '無'}\n🍽️${topRestaurantsText || '無'}`;
  
  // 確保不超過 120 字元
  if (text.length > 120) {
    text = text.substring(0, 117) + '...';
  }

  return createButtonsTemplate(
    '統計資訊',
    '📊 統計資訊',
    text,
    [
      {
        type: 'message',
        label: '📋 我的食記',
        text: '我的食記',
      } as MessageAction,
      {
        type: 'message',
        label: '🔙 主選單',
        text: '主選單',
      } as MessageAction,
    ]
  );
}

/**
 * Create record review prompt
 */
export function createRecordReviewPrompt(): TextMessage & { quickReply?: QuickReply } {
  return createQuickReply(
    '請直接分享你的用餐體驗，例如：\n「今天去吃八方雲集，鍋貼超好吃」\n「昨天去了鼎泰豐，小籠包不錯但有點貴」',
    [
      { label: '📋 我的食記', text: '我的食記' },
      { label: '❓ 幫助', text: '幫助' },
    ]
  );
}

/**
 * Detect if message is a command
 */
export function isCommand(message: string): boolean {
  const commands = [
    '幫助',
    'help',
    '主選單',
    'menu',
    '我的食記',
    '記錄食記',
    '餐廳查詢',
    '統計資訊',
    '查看網站',
    '網站',
    '查看',
  ];
  return commands.some((cmd) => message.includes(cmd));
}

/**
 * Extract restaurant name from query message
 */
export function extractRestaurantName(message: string): string | null {
  // Patterns: "查看 八方雲集", "餐廳查詢 鼎泰豐", "八方雲集的評論", "八方雲集的詳情"
  const patterns = [
    /(?:查看|查詢|餐廳查詢)\s*(.+?)(?:\s|$|的)/,
    /(.+?)(?:的評論|的資訊|的統計|的詳情|的詳細)/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // If message doesn't match patterns, try to extract restaurant name directly
  const words = message.split(/\s+/).filter((w) => w.length > 1);
  if (words.length > 0 && !['查看', '查詢', '餐廳查詢', '評論', '資訊', '統計'].includes(words[0])) {
    return words[0];
  }

  return null;
}

