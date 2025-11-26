import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRestaurant extends Document {
  name: string; // Unique restaurant name
  totalReviews: number;
  averageRating: number;
  tagCounts: { [key: string]: number }; // Count of each tag
  priceRange: {
    high: number; // Count of "高" reviews
    medium: number; // Count of "中" reviews
    low: number; // Count of "便宜" reviews
  };
  averagePrice: number | null; // Average price amount if available
  mealTypeDistribution: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  lastReviewDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    tagCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    priceRange: {
      high: {
        type: Number,
        default: 0,
      },
      medium: {
        type: Number,
        default: 0,
      },
      low: {
        type: Number,
        default: 0,
      },
    },
    averagePrice: {
      type: Number,
      default: null,
    },
    mealTypeDistribution: {
      breakfast: {
        type: Number,
        default: 0,
      },
      lunch: {
        type: Number,
        default: 0,
      },
      dinner: {
        type: Number,
        default: 0,
      },
    },
    lastReviewDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RestaurantSchema.index({ totalReviews: -1 });
RestaurantSchema.index({ averageRating: -1 });
RestaurantSchema.index({ lastReviewDate: -1 });

const Restaurant: Model<IRestaurant> =
  mongoose.models.Restaurant || mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);

export default Restaurant;

