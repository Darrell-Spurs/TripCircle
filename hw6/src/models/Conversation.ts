import mongoose, { Schema, Document, Model } from 'mongoose';
import MessageSchema, { IMessage } from './Message';

export interface IConversation extends Document {
  userId: string; // LINE user ID
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: String,
      required: true,
      index: true, // Index for faster queries
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Update the updatedAt field before saving
ConversationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Create index on userId for faster queries
ConversationSchema.index({ userId: 1, updatedAt: -1 });

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;

