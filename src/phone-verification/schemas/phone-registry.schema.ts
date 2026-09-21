/**
 * phone-verification/schemas/phone-registry.schema.ts
 * =====================================================
 * Anti-farm ledger keyed by PHONE NUMBER (not user).
 *
 * This is the SOURCE OF TRUTH for "one reward-eligible account per phone
 * number". It deliberately outlives any single user account: if someone
 * deletes their account, reinstalls the app, and signs up again with the
 * SAME phone number, the registry row for that phone is still here — so the
 * one-time welcome credit (and, later, the referral reward) is NOT granted a
 * second time.
 *
 * Keyed by the E.164 normalized phone (`+234...`) with a UNIQUE index so a
 * phone can only ever have one row.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PhoneRegistryDocument = PhoneRegistry & Document;

@Schema({ timestamps: true })
export class PhoneRegistry {
  /** Normalized E.164 phone number, e.g. "+2348031234567". Unique. */
  @Prop({ type: String, required: true, unique: true, index: true })
  phoneE164: string;

  /** The first user who ever verified this phone number. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  firstUserId: Types.ObjectId;

  /** True once the one-time welcome credit has been granted for this phone. */
  @Prop({ type: Boolean, default: false })
  welcomeGranted: boolean;

  /** True once a referral reward has been redeemed against this phone. */
  @Prop({ type: Boolean, default: false })
  referralRedeemed: boolean;

  // createdAt / updatedAt added automatically by { timestamps: true }.
  createdAt: Date;
}

export const PhoneRegistrySchema = SchemaFactory.createForClass(PhoneRegistry);

// Belt AND suspenders: unique at the DB level so a phone is one row only.
PhoneRegistrySchema.index({ phoneE164: 1 }, { unique: true });
