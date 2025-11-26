'use client';

import { useEffect, useState } from 'react';
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

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    price: '',
    minRating: '',
    tag: '',
  });
  const [sortBy, setSortBy] = useState('totalReviews');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRestaurants();
  }, [filters, sortBy, page]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder: 'desc',
      });
      if (filters.search) params.append('search', filters.search);
      if (filters.price) params.append('price', filters.price);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.tag) params.append('tag', filters.tag);

      const response = await fetch(`/api/restaurants?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data.restaurants);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopTags = (tagCounts: { [key: string]: number }) => {
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
  };

  const getPriceRange = (priceRange: Restaurant['priceRange']) => {
    const { high, medium, low } = priceRange;
    if (high > medium && high > low) return '高';
    if (medium > high && medium > low) return '中';
    if (low > high && low > medium) return '便宜';
    return '中';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">🍴 Restaurants</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Filters & Sort</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search restaurant..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <select
                value={filters.price}
                onChange={(e) => setFilters({ ...filters, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All</option>
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="便宜">便宜</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tag</label>
              <input
                type="text"
                value={filters.tag}
                onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                placeholder="Search tag..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="totalReviews">Most Reviews</option>
                <option value="averageRating">Highest Rating</option>
                <option value="lastReviewDate">Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Restaurants Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading restaurants...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">No restaurants found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant._id}
                href={`/restaurants/${encodeURIComponent(restaurant.name)}`}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{restaurant.name}</h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    ⭐ {restaurant.averageRating.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {restaurant.totalReviews} reviews
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    價格: {getPriceRange(restaurant.priceRange)}
                  </div>
                  {getTopTags(restaurant.tagCounts).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getTopTags(restaurant.tagCounts).map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && restaurants.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-shadow"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

