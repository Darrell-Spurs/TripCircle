/**
 * Data service for fetching data from database
 * Used by LINE Bot command handler
 */

import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';
import Restaurant from '@/lib/models/Restaurant';

/**
 * Get user's reviews
 */
export async function getUserReviews(userId: string, limit: number = 10) {
  await connectDB();
  const reviews = await Review.find({ userId, isComplete: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();

  return reviews.map((review) => ({
    id: review._id.toString(),
    restaurantName: review.restaurantName,
    rating: review.rating,
    summary: review.aiSummary,
    tags: review.tags,
    price: review.price,
    mealType: review.mealType,
    createdAt: review.createdAt,
  }));
}

/**
 * Get restaurant by name
 */
export async function getRestaurantByName(name: string) {
  await connectDB();
  const restaurant = await Restaurant.findOne({
    name: new RegExp(name, 'i'),
  }).exec();

  if (!restaurant) {
    return null;
  }

  // Convert tagCounts Map to object
  const tagCounts: { [key: string]: number } = {};
  if (restaurant.tagCounts) {
    restaurant.tagCounts.forEach((value, key) => {
      tagCounts[key] = value;
    });
  }

  return {
    name: restaurant.name,
    totalReviews: restaurant.totalReviews,
    averageRating: restaurant.averageRating,
    tagCounts,
    priceRange: restaurant.priceRange,
    mealTypeDistribution: restaurant.mealTypeDistribution,
  };
}

/**
 * Get other users' reviews (excluding current user)
 */
export async function getOtherUsersReviews(userId: string, limit: number = 10) {
  await connectDB();
  const reviews = await Review.find({
    userId: { $ne: userId },
    isComplete: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();

  return reviews.map((review) => ({
    id: review._id.toString(),
    restaurantName: review.restaurantName,
    rating: review.rating,
    summary: review.aiSummary,
    tags: review.tags,
    price: review.price,
    mealType: review.mealType,
    createdAt: review.createdAt,
  }));
}

/**
 * Get reviews for a specific restaurant
 */
export async function getRestaurantReviews(restaurantName: string, limit: number = 10) {
  await connectDB();
  const reviews = await Review.find({
    restaurantName: new RegExp(restaurantName, 'i'),
    isComplete: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();

  return reviews.map((review) => ({
    id: review._id.toString(),
    restaurantName: review.restaurantName,
    rating: review.rating,
    summary: review.aiSummary,
    tags: review.tags,
    price: review.price,
    mealType: review.mealType,
    createdAt: review.createdAt,
  }));
}

/**
 * Get statistics
 */
export async function getStatistics() {
  await connectDB();

  const totalReviews = await Review.countDocuments({ isComplete: true });
  const totalRestaurants = await Restaurant.countDocuments();

  // Calculate average rating
  const reviews = await Review.find({ isComplete: true }).select('rating').exec();
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  // Get top tags
  const allReviews = await Review.find({ isComplete: true }).select('tags').exec();
  const tagCounts: { [key: string]: number } = {};
  allReviews.forEach((review) => {
    review.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Get top restaurants
  const restaurants = await Restaurant.find()
    .sort({ totalReviews: -1 })
    .limit(10)
    .exec();
  const topRestaurants = restaurants.map((r) => ({
    name: r.name,
    reviews: r.totalReviews,
    rating: r.averageRating,
  }));

  // Get price distribution
  const priceDistribution = {
    high: await Review.countDocuments({ price: '高', isComplete: true }),
    medium: await Review.countDocuments({ price: '中', isComplete: true }),
    low: await Review.countDocuments({ price: '便宜', isComplete: true }),
  };

  // Get meal type distribution
  const mealTypeDistribution = {
    breakfast: await Review.countDocuments({ mealType: 'breakfast', isComplete: true }),
    lunch: await Review.countDocuments({ mealType: 'lunch', isComplete: true }),
    dinner: await Review.countDocuments({ mealType: 'dinner', isComplete: true }),
  };

  return {
    totalReviews,
    totalRestaurants,
    averageRating: Math.round(averageRating * 10) / 10,
    topTags,
    topRestaurants,
    priceDistribution,
    mealTypeDistribution,
  };
}

