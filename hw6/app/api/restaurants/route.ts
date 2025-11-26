import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Restaurant from '@/lib/models/Restaurant';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const price = searchParams.get('price') as '高' | '中' | '便宜' | null;
    const minRating = searchParams.get('minRating');
    const tag = searchParams.get('tag');
    const sortBy = searchParams.get('sortBy') || 'totalReviews'; // totalReviews, averageRating, lastReviewDate
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (search) {
      query.name = new RegExp(search, 'i');
    }

    if (price) {
      if (price === '高') {
        query['priceRange.high'] = { $gt: 0 };
      } else if (price === '中') {
        query['priceRange.medium'] = { $gt: 0 };
      } else if (price === '便宜') {
        query['priceRange.low'] = { $gt: 0 };
      }
    }

    if (minRating) {
      query.averageRating = { $gte: parseFloat(minRating) };
    }

    if (tag) {
      query[`tagCounts.${tag}`] = { $gt: 0 };
    }

    // Build sort object
    const sort: any = {};
    if (sortBy === 'totalReviews') {
      sort.totalReviews = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'averageRating') {
      sort.averageRating = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'lastReviewDate') {
      sort.lastReviewDate = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.totalReviews = -1; // Default
    }

    // Get restaurants
    const restaurants = await Restaurant.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    // Get total count
    const total = await Restaurant.countDocuments(query);

    return NextResponse.json({
      restaurants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] Error fetching restaurants:', error);
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
  }
}

