import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String, enum: ['text', 'image', 'product_card'], default: 'text' })
  type: string;

  // For product_card messages
  @Prop({
    type: {
      listingId: { type: Types.ObjectId, ref: 'Listing' },
      itemName: { type: String },
      price: { type: Number },
      image: { type: String },
      storeName: { type: String },
    },
    default: null,
  })
  productCard: {
    listingId: Types.ObjectId;
    itemName: string;
    price: number;
    image: string;
    storeName: string;
  } | null;

  // Users who have read this message
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  readBy: Types.ObjectId[];

  // Image/file attachment URLs
  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  // Edit tracking
  @Prop({ type: Boolean, default: false })
  edited: boolean;

  @Prop({ type: Date, default: null })
  editedAt?: Date;

  // Denormalized snapshot of the message this one replies to (for preview)
  @Prop({
    type: {
      messageId: { type: Types.ObjectId, ref: 'Message' },
      content: { type: String },
      senderId: { type: Types.ObjectId, ref: 'User' },
    },
    default: null,
  })
  replyTo?: {
    messageId: Types.ObjectId;
    content: string;
    senderId: Types.ObjectId;
  } | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes
MessageSchema.index({ conversationId: 1, createdAt: -1 });
