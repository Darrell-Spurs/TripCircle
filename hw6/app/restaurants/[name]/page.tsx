'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Restaurant {
  _id: string;
  name: string;
  totalReviews: number;
  averageRating: number;
  tagCounts: { [key: string]: number };
  priceRange: {
    high: number;
    medium: number;
    low: number;
  };
  mealTypeDistribution: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
}

interface Review {
  _id: string;
  restaurantName: string;
  aiSummary: string;
  tags: string[];
  rating: number;
  price: string | null;
  mealType: string | null;
  createdAt: string;
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const restaurantName = params.name as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantName) {
      fetchRestaurant();
    }
  }, [restaurantName]);

  const fetchRestaurant = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/restaurants/${encodeURIComponent(restaurantName)}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurant(data.restaurant);
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMealTypeText = (mealType: string | null) => {
    if (!mealType) return '';
    return mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : '晚餐';
  };

  const getPriceText = (price: string | null) => {
    if (!price) return '';
    return price === '高' ? '高' : price === '中' ? '中' : '便宜';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Restaurant not found</p>
        </div>
      </main>
    );
  }

  const topTags = Object.entries(restaurant.tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/restaurants"
          className="text-orange-600 hover:text-orange-700 mb-4 inline-block"
        >
          ← Back to Restaurants
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{restaurant.name}</h1>
          <div className="flex items-center gap-6 mb-6">
            <div className="text-3xl font-bold text-yellow-600">
              ⭐ {restaurant.averageRating.toFixed(1)}
            </div>
            <div className="text-gray-600">
              {restaurant.totalReviews} reviews
            </div>
          </div>

          {/* Price Distribution */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">💰 Price Distribution</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{restaurant.priceRange.high}</div>
                <div className="text-sm text-gray-600">高</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{restaurant.priceRange.medium}</div>
                <div className="text-sm text-gray-600">中</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{restaurant.priceRange.low}</div>
                <div className="text-sm text-gray-600">便宜</div>
              </div>
            </div>
          </div>

          {/* Meal Type Distribution */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">🍴 Meal Type Distribution</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {restaurant.mealTypeDistribution.breakfast}
                </div>
                <div className="text-sm text-gray-600">早餐</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {restaurant.mealTypeDistribution.lunch}
                </div>
                <div className="text-sm text-gray-600">午餐</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {restaurant.mealTypeDistribution.dinner}
                </div>
                <div className="text-sm text-gray-600">晚餐</div>
              </div>
            </div>
          </div>

          {/* Popular Tags */}
          {topTags.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">🏷️ Popular Tags</h2>
              <div className="flex flex-wrap gap-2">
                {topTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {tag} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Reviews ({reviews.length})</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      ⭐ {review.rating}/5
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {review.price && <div>價格: {getPriceText(review.price)}</div>}
                    {review.mealType && <div>餐點: {getMealTypeText(review.mealType)}</div>}
                    <div className="mt-1">
                      {new Date(review.createdAt).toLocaleString('zh-TW')}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">{review.aiSummary}</p>
                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {review.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

