import Review, { IReview } from '../models/Review';
import Restaurant, { IRestaurant } from '../models/Restaurant';
import UserStats, { IUserStats } from '../models/UserStats';
import { ExtractedReviewInfo } from './review-extraction.service';

/**
 * Detect meal type based on time of day
 */
export function detectMealTypeByTime(reviewTime: Date): 'breakfast' | 'lunch' | 'dinner' {
  const hour = reviewTime.getHours();

  if (hour >= 5 && hour < 11) {
    return 'breakfast'; // 5:00 - 10:59
  } else if (hour >= 11 && hour < 17) {
    return 'lunch'; // 11:00 - 16:59
  } else {
    return 'dinner'; // 17:00 - 4:59
  }
}

/**
 * Infer price level from amount
 */
export function inferPriceFromAmount(amount: number): '高' | '中' | '便宜' {
  if (amount < 100) return '便宜';
  if (amount < 300) return '中';
  return '高';
}

/**
 * Process review data and determine what information is missing
 */
export function processReviewData(
  extracted: ExtractedReviewInfo,
  reviewTime: Date
): ExtractedReviewInfo {
  // Auto-detect meal type by time if not mentioned
  if (!extracted.mealType) {
    extracted.mealType = detectMealTypeByTime(reviewTime);
    extracted.needsMealTypeInfo = true; // Ask for confirmation
  }

  // Infer price from amount if amount is provided but price is not
  if (extracted.priceAmount !== null && extracted.priceAmount > 0) {
    if (!extracted.price) {
      extracted.price = inferPriceFromAmount(extracted.priceAmount);
    }
    extracted.needsPriceInfo = false; // We have price info, no need to ask
  }

  // Check what's missing
  if (!extracted.price && extracted.priceAmount === null) {
    extracted.needsPriceInfo = true;
  }

  return extracted;
}

/**
 * Save complete review and update aggregates
 */
export async function saveReview(
  reviewData: ExtractedReviewInfo,
  userId: string,
  reviewTime: Date
): Promise<IReview> {
  // Create review
  const review = new Review({
    userId,
    restaurantName: reviewData.restaurantName,
    originalMessage: reviewData.originalMessage || '',
    aiSummary: reviewData.summary,
    tags: reviewData.tags,
    rating: reviewData.rating,
    price: reviewData.price,
    priceAmount: reviewData.priceAmount,
    mealType: reviewData.mealType,
    reviewTime,
    needsPriceInfo: false,
    needsMealTypeInfo: false,
    isComplete: true,
  });

  await review.save();

  // Update restaurant statistics
  await updateRestaurantStats(reviewData.restaurantName, reviewData);

  // Update user statistics
  await updateUserStats(userId, reviewData);

  return review;
}

/**
 * Update restaurant statistics
 */
export async function updateRestaurantStats(
  restaurantName: string,
  reviewData: ExtractedReviewInfo
): Promise<void> {
  const restaurant = await Restaurant.findOneAndUpdate(
    { name: restaurantName },
    {},
    { upsert: true, new: true }
  );

  if (!restaurant) return;

  // Update total reviews
  restaurant.totalReviews += 1;

  // Update average rating
  const allReviews = await Review.find({ restaurantName, isComplete: true });
  const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
  restaurant.averageRating = totalRating / allReviews.length;

  // Update tag counts
  reviewData.tags.forEach((tag) => {
    // tagCounts is a Mongoose Map, handle it properly
    const tagCountsMap = restaurant.tagCounts as unknown as Map<string, number>;
    const currentCount = (tagCountsMap instanceof Map ? tagCountsMap.get(tag) : (tagCountsMap as any)[tag]) || 0;
    if (tagCountsMap instanceof Map) {
      tagCountsMap.set(tag, currentCount + 1);
    } else {
      (tagCountsMap as any)[tag] = currentCount + 1;
    }
  });

  // Update price range
  if (reviewData.price === '高') {
    restaurant.priceRange.high += 1;
  } else if (reviewData.price === '中') {
    restaurant.priceRange.medium += 1;
  } else if (reviewData.price === '便宜') {
    restaurant.priceRange.low += 1;
  }

  // Update average price
  if (reviewData.priceAmount !== null && reviewData.priceAmount > 0) {
    const reviewsWithPrice = await Review.find({
      restaurantName,
      priceAmount: { $ne: null },
      isComplete: true,
    });
    const totalPrice = reviewsWithPrice.reduce((sum, r) => sum + (r.priceAmount || 0), 0);
    restaurant.averagePrice = totalPrice / reviewsWithPrice.length;
  }

  // Update meal type distribution
  if (reviewData.mealType === 'breakfast') {
    restaurant.mealTypeDistribution.breakfast += 1;
  } else if (reviewData.mealType === 'lunch') {
    restaurant.mealTypeDistribution.lunch += 1;
  } else if (reviewData.mealType === 'dinner') {
    restaurant.mealTypeDistribution.dinner += 1;
  }

  // Update last review date
  restaurant.lastReviewDate = new Date();

  await restaurant.save();
}

/**
 * Update user statistics
 */
export async function updateUserStats(
  userId: string,
  reviewData: ExtractedReviewInfo
): Promise<void> {
  const userStats = await UserStats.findOneAndUpdate(
    { userId },
    {},
    { upsert: true, new: true }
  );

  if (!userStats) return;

  // Update total reviews
  userStats.totalReviews += 1;

  // Update last review date
  userStats.lastReviewDate = new Date();

  // Update favorite tags (top 5 most used tags)
  const userReviews = await Review.find({ userId, isComplete: true });
  const tagCounts: { [key: string]: number } = {};
  userReviews.forEach((review) => {
    review.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  userStats.favoriteTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);

  await userStats.save();
}

