/**
 * wallet/schemas/wallet-transaction.schema.ts
 * ==============================================
 * Append-only ledger. Every wallet movement is one row here; the Wallet
 * balances are cached aggregates derived from these rows.
 *
 * `amount` is ALWAYS POSITIVE — the direction ('credit'/'debit') implies the
 * sign. All amounts are in KOBO (₦1 = 100 kobo).
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum WalletTxnDirection {
  Credit = 'credit',
  Debit = 'debit',
}

export enum WalletBucket {
  Promo = 'promo',
  Earned = 'earned',
}

export enum WalletTxnType {
  SignupCredit = 'signup_credit',
  ReferralReward = 'referral_reward',
  AffiliateCommission = 'affiliate_commission',
  PurchaseRedemption = 'purchase_redemption',
  PurchaseRefund = 'purchase_refund',
  Withdrawal = 'withdrawal',
  Reversal = 'reversal',
  AdminAdjustment = 'admin_adjustment',
}

export enum WalletTxnStatus {
  Pending = 'pending',
  Available = 'available',
  Spent = 'spent',
  Reversed = 'reversed',
  Cancelled = 'cancelled',
}

export type WalletTransactionDocument = WalletTransaction & Document;

@Schema({ timestamps: true })
export class WalletTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /** Always positive (kobo). Direction implies the sign. */
  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ type: String, enum: WalletTxnDirection, required: true })
  direction: WalletTxnDirection;

  @Prop({ type: String, enum: WalletBucket, required: true })
  bucket: WalletBucket;

  @Prop({ type: String, enum: WalletTxnType, required: true })
  type: WalletTxnType;

  @Prop({ type: String, enum: WalletTxnStatus, required: true, default: WalletTxnStatus.Available })
  status: WalletTxnStatus;

  @Prop({ type: String, default: '' })
  description: string;

  /** Optional link to the order that triggered this movement. */
  @Prop({ type: Types.ObjectId, default: null })
  orderId?: Types.ObjectId;

  /** Free-form reference: referred user id, affiliate order id, withdrawal id, etc. */
  @Prop({ type: String, default: null })
  refId?: string;

  /** Unique (sparse) idempotency guard so a movement is only applied once. */
  @Prop({ type: String, default: null })
  idempotencyKey?: string;

  /** When a pending credit becomes available (e.g. affiliate hold expiry). */
  @Prop({ type: Date, default: null })
  availableAt?: Date;
}

export const WalletTransactionSchema =
  SchemaFactory.createForClass(WalletTransaction);

// Unique only when idempotencyKey is present (sparse) — prevents double-apply.
WalletTransactionSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

// Efficient newest-first listing / filtering per user.
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ userId: 1, type: 1, status: 1, createdAt: -1 });
