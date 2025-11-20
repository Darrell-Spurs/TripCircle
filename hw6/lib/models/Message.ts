import mongoose, { Schema } from 'mongoose';

// Interface for message data (not a Document since it's a subdocument)
export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    _id: false, // Don't create _id for subdocuments
  }
);

export default MessageSchema;

