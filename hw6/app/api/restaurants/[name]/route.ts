import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Restaurant from '@/lib/models/Restaurant';
import Review from '@/lib/models/Review';

export async function GET(
  req: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    await connectDB();

    const restaurantName = decodeURIComponent(params.name);

    // Get restaurant
    const restaurant = await Restaurant.findOne({
      name: new RegExp(restaurantName, 'i'),
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Get all reviews for this restaurant
    const reviews = await Review.find({
      restaurantName: restaurant.name,
      isComplete: true,
    })
      .sort({ createdAt: -1 })
      .exec();

    return NextResponse.json({
      restaurant,
      reviews,
    });
  } catch (error) {
    console.error('[API] Error fetching restaurant:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurant' }, { status: 500 });
  }
}

