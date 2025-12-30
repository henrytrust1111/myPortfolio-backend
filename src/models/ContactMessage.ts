import mongoose, { Document, Schema } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  user_email: string;
  Subject: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  status: 'pending' | 'responded' | 'archived';
}

const contactSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    user_email: {
      type: String,
      required: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    Subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000
    },
    isRead: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'responded', 'archived'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

export default mongoose.model<IContactMessage>('ContactMessage', contactSchema);