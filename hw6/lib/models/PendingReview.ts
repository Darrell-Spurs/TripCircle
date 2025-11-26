import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPendingReview extends Document {
  userId: string; // LINE user ID (unique per user)
  extractedData: {
    restaurantName: string;
    summary: string;
    tags: string[];
    rating: number;
    price: '高' | '中' | '便宜' | null;
    priceAmount: number | null;
    mealType: 'breakfast' | 'lunch' | 'dinner' | null;
    originalMessage: string;
  };
  missingFields: string[]; // ['price', 'mealType']
  createdAt: Date;
  expiresAt: Date; // Auto-delete after 10 minutes
}

const PendingReviewSchema = new Schema<IPendingReview>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    extractedData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    missingFields: {
      type: [String],
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for auto-deletion
PendingReviewSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PendingReview: Model<IPendingReview> =
  mongoose.models.PendingReview ||
  mongoose.model<IPendingReview>('PendingReview', PendingReviewSchema);

export default PendingReview;

