interface ReviewCardProps {
  review: {
    _id: string;
    restaurantName: string;
    aiSummary: string;
    tags: string[];
    rating: number;
    price: string | null;
    priceAmount: number | null;
    mealType: string | null;
    createdAt: string;
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const getMealTypeText = (mealType: string | null) => {
    if (!mealType) return '';
    return mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : '晚餐';
  };

  const getPriceText = (price: string | null) => {
    if (!price) return '';
    return price === '高' ? '高' : price === '中' ? '中' : '便宜';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{review.restaurantName}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(review.createdAt).toLocaleString('zh-TW')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-600">⭐ {review.rating}/5</div>
          {review.price && (
            <div className="text-sm text-gray-600 mt-1">價格: {getPriceText(review.price)}</div>
          )}
          {review.mealType && (
            <div className="text-sm text-gray-600">餐點: {getMealTypeText(review.mealType)}</div>
          )}
        </div>
      </div>
      <p className="text-gray-700 mb-4">{review.aiSummary}</p>
      {review.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
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
  );
}

