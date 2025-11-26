import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';

export async function GET() {
  try {
    await connectDB();

    // Get all reviews with tags
    const allReviews = await Review.find({ isComplete: true }).select('tags createdAt');

    // Calculate tag frequency
    const tagFrequency: { [key: string]: number } = {};
    const tagTrends: { [key: string]: { [key: string]: number } } = {};

    allReviews.forEach((review) => {
      const month = review.createdAt.toISOString().substring(0, 7); // YYYY-MM

      review.tags.forEach((tag) => {
        // Frequency
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;

        // Trends by month
        if (!tagTrends[tag]) {
          tagTrends[tag] = {};
        }
        tagTrends[tag][month] = (tagTrends[tag][month] || 0) + 1;
      });
    });

    // Get top tags
    const topTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count }));

    // Get tag combinations (most common pairs)
    const tagPairs: { [key: string]: number } = {};
    allReviews.forEach((review) => {
      const tags = review.tags;
      for (let i = 0; i < tags.length; i++) {
        for (let j = i + 1; j < tags.length; j++) {
          const pair = [tags[i], tags[j]].sort().join(' + ');
          tagPairs[pair] = (tagPairs[pair] || 0) + 1;
        }
      }
    });

    const topTagPairs = Object.entries(tagPairs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([pair, count]) => ({ pair, count }));

    return NextResponse.json({
      tagFrequency,
      topTags,
      tagTrends,
      topTagPairs,
    });
  } catch (error) {
    console.error('[API] Error fetching tag statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch tag statistics' }, { status: 500 });
  }
}

