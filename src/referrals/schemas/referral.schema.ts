/**
 * referrals/schemas/referral.schema.ts
 * ======================================
 * One row per REFERRED user (the referee). Tracks the referral through its
 * lifecycle:
 *
 *   pending    → created at signup; not yet reward-qualified.
 *   qualified  → the referee's cumulative completed-order spend crossed the
 *                threshold (interim state; immediately becomes rewarded).
 *   rewarded   → the referrer has been paid the one-time referral reward.
 *   void        → anti-farm: the referee's phone had already redeemed a referral
 *                on a previous account, so this one can never pay out.
 *
 * All money is in KOBO. `cumulativeQualifyingSpend` caches the sum of the
 * referee's Completed orders' totalAmount at the last check.
 *
 * The anti-farm guarantee ("one referral redemption per phone number") lives in
 * the PhoneRegistry collection (referralRedeemed flag), keyed by phoneE164 — it
 * outlives account deletion / reinstalls. See ReferralsService.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ReferralStatus {
  Pending = 'pending',
  Qualified = 'qualified',
  Rewarded = 'rewarded',
  Void = 'void',
}

export type ReferralDocument = Referral & Document;

@Schema({ timestamps: true })
export class Referral {
  /** The user who referred (and gets paid the reward). */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  referrerId: Types.ObjectId;

  /** The user who was referred. One referral row per referee. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  refereeId: Types.ObjectId;

  /** The referee's verified phone (set once they verify — anti-farm key). */
  @Prop({ type: String, default: null })
  refereePhoneE164?: string;

  @Prop({
    type: String,
    enum: Object.values(ReferralStatus),
    default: ReferralStatus.Pending,
    index: true,
  })
  status: ReferralStatus;

  /** Cached sum of the referee's Completed orders' totalAmount (kobo). */
  @Prop({ type: Number, default: 0 })
  cumulativeQualifyingSpend: number;

  /** The wallet transaction that paid the referrer (once rewarded). */
  @Prop({ type: Types.ObjectId, default: null })
  rewardTxnId?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  qualifiedAt?: Date;

  @Prop({ type: Date, default: null })
  rewardedAt?: Date;

  // createdAt / updatedAt added automatically by { timestamps: true }.
  createdAt: Date;
  updatedAt: Date;
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);

// One referral row per referee (belt AND suspenders with the service guard).
ReferralSchema.index({ refereeId: 1 }, { unique: true });
ReferralSchema.index({ referrerId: 1, status: 1 });
