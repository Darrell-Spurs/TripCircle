import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import UserStats from '@/lib/models/UserStats';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    const sortBy = searchParams.get('sortBy') || 'totalReviews'; // totalReviews, lastReviewDate
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc

    // Build sort object
    const sort: any = {};
    if (sortBy === 'totalReviews') {
      sort.totalReviews = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'lastReviewDate') {
      sort.lastReviewDate = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort.totalReviews = -1; // Default
    }

    // Get users
    const users = await UserStats.find()
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    // Get total count
    const total = await UserStats.countDocuments();

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API] Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

