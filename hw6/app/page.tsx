'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatsCard from './components/StatsCard';

interface Stats {
  totalReviews?: number;
  totalRestaurants?: number;
  activeUsers?: number;
  averageRating?: number;
  priceDistribution?: {
    高: number;
    中: number;
    便宜: number;
  };
  mealTypeDistribution?: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  reviewsLast30Days?: number;
  topRestaurants?: Array<{
    name: string;
    totalReviews: number;
    averageRating: number;
  }>;
  topTags?: Array<{
    tag: string;
    count: number;
  }>;
  // Conversation stats (from /api/stats)
  totalConversations?: number;
  totalMessages?: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh stats every 10 seconds for real-time updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/reviews');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">
          🍽️ Food Tracker Dashboard
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading statistics...</p>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Reviews"
                value={stats.totalReviews ?? 0}
                icon="📝"
                color="blue"
              />
              <StatsCard
                title="Restaurants"
                value={stats.totalRestaurants ?? 0}
                icon="🍴"
                color="green"
              />
              <StatsCard
                title="Active Users"
                value={stats.activeUsers ?? 0}
                icon="👥"
                color="purple"
              />
              <StatsCard
                title="Avg Rating"
                value={stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                icon="⭐"
                color="yellow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {stats.priceDistribution && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">💰 Price Distribution</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">高 (Expensive)</span>
                      <span className="font-bold text-red-600">{stats.priceDistribution.高 || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">中 (Medium)</span>
                      <span className="font-bold text-yellow-600">{stats.priceDistribution.中 || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">便宜 (Cheap)</span>
                      <span className="font-bold text-green-600">{stats.priceDistribution.便宜 || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {stats.mealTypeDistribution && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">🍴 Meal Type Distribution</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">早餐 (Breakfast)</span>
                      <span className="font-bold text-orange-600">{stats.mealTypeDistribution.breakfast || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">午餐 (Lunch)</span>
                      <span className="font-bold text-blue-600">{stats.mealTypeDistribution.lunch || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">晚餐 (Dinner)</span>
                      <span className="font-bold text-purple-600">{stats.mealTypeDistribution.dinner || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {stats.topRestaurants && stats.topRestaurants.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">🏆 Top Restaurants</h2>
                  <div className="space-y-2">
                    {stats.topRestaurants.map((restaurant, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-700">{restaurant.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">{restaurant.totalReviews} reviews</span>
                          <span className="text-sm font-bold text-yellow-600">
                            ⭐ {restaurant.averageRating ? restaurant.averageRating.toFixed(1) : '0.0'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {stats.topTags && stats.topTags.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">🏷️ Popular Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {stats.topTags.slice(0, 10).map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {tag.tag} ({tag.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {stats.reviewsLast30Days !== undefined && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">📊 Recent Activity</h2>
                <p className="text-gray-600">
                  {stats.reviewsLast30Days} reviews in the last 30 days
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">Failed to load statistics</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/reviews"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">📝 Reviews</h2>
            <p className="text-gray-600">
              Browse all food reviews, filter by restaurant, price, meal type, and more.
            </p>
          </Link>

          <Link
            href="/restaurants"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">🍴 Restaurants</h2>
            <p className="text-gray-600">
              View all restaurants with statistics, ratings, and reviews.
            </p>
          </Link>

          <Link
            href="/stats"
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">📊 Statistics</h2>
            <p className="text-gray-600">
              View comprehensive analytics and trends.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}

