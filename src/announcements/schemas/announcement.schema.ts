/**
 * announcements/schemas/announcement.schema.ts - Announcement Model
 * ===================================================================
 * A broadcast an admin sends to users across one or more channels
 * (in-app alert, push notification, email) — now or scheduled — with
 * audience targeting (all users, a role, or a specific list).
 */

import { BaseSchema } from '@common/schemas/base-schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Announcement extends BaseSchema {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  message: string;

  // Subset of: 'in_app' | 'push' | 'email'
  @Prop({ type: [String], default: ['in_app'] })
  channels: string[];

  // 'all' | 'role' | 'users'
  @Prop({ type: String, default: 'all' })
  audienceType: string;

  @Prop({ type: String, default: null })
  audienceRole?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  audienceUserIds?: Types.ObjectId[];

  @Prop({ type: String, default: null })
  imageUrl?: string;

  // Arbitrary payload, e.g. { route: '/shop' }
  @Prop({ type: Object, default: null })
  data?: Record<string, any>;

  @Prop({ type: Date, default: null })
  scheduleAt?: Date;

  // 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'
  @Prop({ type: String, default: 'sending' })
  status: string;

  @Prop({ type: Date, default: null })
  sentAt?: Date;

  @Prop({
    type: {
      inApp: { type: Number, default: 0 },
      push: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
    },
    default: null,
  })
  counts?: { inApp: number; push: number; email: number };

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

AnnouncementSchema.index({ status: 1, scheduleAt: 1 });
AnnouncementSchema.index({ createdAt: -1 });
