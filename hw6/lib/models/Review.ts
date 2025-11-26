import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  userId: string; // LINE user ID
  restaurantName: string;
  originalMessage: string;
  aiSummary: string;
  tags: string[];
  rating: number; // 1-5
  price: '高' | '中' | '便宜' | null;
  priceAmount: number | null; // Specific amount if mentioned (e.g., 140)
  mealType: 'breakfast' | 'lunch' | 'dinner' | null;
  reviewTime: Date; // When the review was created
  needsPriceInfo: boolean;
  needsMealTypeInfo: boolean;
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    restaurantName: {
      type: String,
      required: true,
      index: true,
    },
    originalMessage: {
      type: String,
      required: true,
    },
    aiSummary: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    price: {
      type: String,
      enum: ['高', '中', '便宜', null],
      default: null,
    },
    priceAmount: {
      type: Number,
      default: null,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', null],
      default: null,
    },
    reviewTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    needsPriceInfo: {
      type: Boolean,
      default: false,
    },
    needsMealTypeInfo: {
      type: Boolean,
      default: false,
    },
    isComplete: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ restaurantName: 1, createdAt: -1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ price: 1 });
ReviewSchema.index({ mealType: 1 });
ReviewSchema.index({ tags: 1 });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;

