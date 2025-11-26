import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';
import Restaurant from '@/lib/models/Restaurant';
import UserStats from '@/lib/models/UserStats';

export async function GET() {
  try {
    await connectDB();

    // Get basic counts
    const totalReviews = await Review.countDocuments({ isComplete: true });
    const totalRestaurants = await Restaurant.countDocuments();
    const activeUsers = await UserStats.countDocuments({ totalReviews: { $gt: 0 } });

    // Get price distribution
    const priceDistribution = {
      高: await Review.countDocuments({ price: '高', isComplete: true }),
      中: await Review.countDocuments({ price: '中', isComplete: true }),
      便宜: await Review.countDocuments({ price: '便宜', isComplete: true }),
    };

    // Get meal type distribution
    const mealTypeDistribution = {
      breakfast: await Review.countDocuments({ mealType: 'breakfast', isComplete: true }),
      lunch: await Review.countDocuments({ mealType: 'lunch', isComplete: true }),
      dinner: await Review.countDocuments({ mealType: 'dinner', isComplete: true }),
    };

    // Get average rating
    const reviewsWithRating = await Review.find({ isComplete: true }).select('rating');
    const averageRating =
      reviewsWithRating.length > 0
        ? reviewsWithRating.reduce((sum, r) => sum + r.rating, 0) / reviewsWithRating.length
        : 0;

    // Get tag frequency
    const allReviews = await Review.find({ isComplete: true }).select('tags');
    const tagFrequency: { [key: string]: number } = {};
    allReviews.forEach((review) => {
      review.tags.forEach((tag) => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    // Get top tags
    const topTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Get reviews over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const reviewsLast30Days = await Review.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      isComplete: true,
    });

    // Get top restaurants
    const topRestaurants = await Restaurant.find()
      .sort({ totalReviews: -1 })
      .limit(5)
      .select('name totalReviews averageRating')
      .exec();

    return NextResponse.json({
      totalReviews,
      totalRestaurants,
      activeUsers,
      averageRating: Math.round(averageRating * 10) / 10,
      priceDistribution,
      mealTypeDistribution,
      tagFrequency,
      topTags,
      reviewsLast30Days,
      topRestaurants,
    });
  } catch (error) {
    console.error('[API] Error fetching review stats:', error);
    return NextResponse.json({ error: 'Failed to fetch review statistics' }, { status: 500 });
  }
}

