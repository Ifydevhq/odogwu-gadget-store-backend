/**
 * affiliate/schemas/affiliate-commission.schema.ts
 * ==================================================
 * One row per affiliate commission earned on an order item. Created when an
 * order COMPLETES (status pending, held for `affiliateHoldDays`), then matured
 * to `available` by the maturation cron, or reversed/cancelled if the order is
 * cancelled/refunded.
 *
 * All money is in KOBO. The paired wallet ledger row (a pending credit in the
 * Earned bucket) is referenced by `walletTxnId`.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum AffiliateCommissionStatus {
  Pending = 'pending',
  Available = 'available',
  Reversed = 'reversed',
  Cancelled = 'cancelled',
}

export type AffiliateCommissionDocument = AffiliateCommission & Document;

@Schema({ timestamps: true })
export class AffiliateCommission {
  /** The affiliate who earns this commission. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  affiliateUserId: Types.ObjectId;

  /** The buyer whose purchase generated the commission. */
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyerId: Types.ObjectId;

  /** The order this commission came from. */
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  /** The purchased listing/product. */
  @Prop({ type: Types.ObjectId, ref: 'Listing', required: true })
  listingId: Types.ObjectId;

  @Prop({ type: String, default: '' })
  itemName: string;

  @Prop({ type: String, default: '' })
  orderNumber: string;

  /** Commission amount in kobo. */
  @Prop({ type: Number, required: true })
  amount: number;

  /** Percentage applied (snapshot). */
  @Prop({ type: Number, default: 0 })
  commissionPercent: number;

  @Prop({
    type: String,
    enum: Object.values(AffiliateCommissionStatus),
    default: AffiliateCommissionStatus.Pending,
    index: true,
  })
  status: AffiliateCommissionStatus;

  /** The wallet ledger row (pending Earned credit) paired with this commission. */
  @Prop({ type: Types.ObjectId, default: null })
  walletTxnId?: Types.ObjectId;

  /** When the pending commission matures to available. */
  @Prop({ type: Date, default: null })
  availableAt?: Date;

  // createdAt / updatedAt added automatically by { timestamps: true }.
  createdAt: Date;
  updatedAt: Date;
}

export const AffiliateCommissionSchema =
  SchemaFactory.createForClass(AffiliateCommission);

// One commission per order+listing (idempotency for processOrderCompletion).
AffiliateCommissionSchema.index(
  { orderId: 1, listingId: 1 },
  { unique: true },
);
AffiliateCommissionSchema.index({ affiliateUserId: 1, status: 1 });
AffiliateCommissionSchema.index({ status: 1, availableAt: 1 }); // maturation cron
