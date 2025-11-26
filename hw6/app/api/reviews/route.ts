import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Review from '@/lib/models/Review';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const restaurant = searchParams.get('restaurant');
    const userId = searchParams.get('userId');
    const price = searchParams.get('price') as '高' | '中' | '便宜' | null;
    const mealType = searchParams.get('mealType') as 'breakfast' | 'lunch' | 'dinner' | null;
    const tag = searchParams.get('tag');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { isComplete: true };

    if (restaurant) {
      query.restaurantName = new RegExp(restaurant, 'i');
    }

    if (userId) {
      query.userId = userId;
    }

    if (price) {
      query.price = price;
    }

    if (mealType) {
      query.mealType = mealType;
    }

    if (tag) {
      query.tags = tag;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Get reviews
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    // Get total count
    const total = await Review.countDocuments(query);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      userId,
      restaurantName,
      originalMessage,
      aiSummary,
      tags,
      rating,
      price,
      priceAmount,
      mealType,
    } = body;

    // Validate required fields
    if (!userId || !restaurantName || !aiSummary || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const review = new Review({
      userId,
      restaurantName,
      originalMessage: originalMessage || '',
      aiSummary,
      tags: tags || [],
      rating,
      price: price || null,
      priceAmount: priceAmount || null,
      mealType: mealType || null,
      reviewTime: new Date(),
      needsPriceInfo: false,
      needsMealTypeInfo: false,
      isComplete: true,
    });

    await review.save();

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('[API] Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

