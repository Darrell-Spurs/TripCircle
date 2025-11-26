import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserStats extends Document {
  userId: string; // LINE user ID (unique)
  totalReviews: number;
  lastReviewDate: Date;
  favoriteTags: string[]; // Most frequently used tags
  createdAt: Date;
  updatedAt: Date;
}

const UserStatsSchema = new Schema<IUserStats>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    lastReviewDate: {
      type: Date,
      default: Date.now,
    },
    favoriteTags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserStatsSchema.index({ totalReviews: -1 });
UserStatsSchema.index({ lastReviewDate: -1 });

const UserStats: Model<IUserStats> =
  mongoose.models.UserStats || mongoose.model<IUserStats>('UserStats', UserStatsSchema);

export default UserStats;

