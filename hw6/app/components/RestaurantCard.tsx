import Link from 'next/link';

interface RestaurantCardProps {
  restaurant: {
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
  };
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const getTopTags = (tagCounts: { [key: string]: number }) => {
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
  };

  const getPriceRange = (priceRange: RestaurantCardProps['restaurant']['priceRange']) => {
    const { high, medium, low } = priceRange;
    if (high > medium && high > low) return '高';
    if (medium > high && medium > low) return '中';
    if (low > high && low > medium) return '便宜';
    return '中';
  };

  return (
    <Link
      href={`/restaurants/${encodeURIComponent(restaurant.name)}`}
      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow block"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{restaurant.name}</h3>
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-bold text-yellow-600">⭐ {restaurant.averageRating.toFixed(1)}</div>
        <div className="text-sm text-gray-600">{restaurant.totalReviews} reviews</div>
      </div>
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">價格: {getPriceRange(restaurant.priceRange)}</div>
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
  );
}

