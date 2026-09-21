/**
 * withdrawals/schemas/withdrawal-request.schema.ts
 * =================================================
 * A REQUEST-ONLY withdrawal. The user asks to cash out part of their AVAILABLE
 * EARNED wallet balance. On request the amount is immediately debited (held out
 * of the wallet via a `withdrawal` ledger row) so it can't be double-spent.
 *
 * Lifecycle:
 *   pending  → created + wallet debited (funds held)
 *   paid     → admin paid the user OFFLINE and marked it paid (money already left)
 *   rejected → admin declined; the hold debit is reversed (funds returned)
 *
 * All amounts are in KOBO (₦1 = 100 kobo).
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum WithdrawalStatus {
  Pending = 'pending',
  Paid = 'paid',
  Rejected = 'rejected',
}

export type WithdrawalRequestDocument = WithdrawalRequest & Document;

@Schema({ timestamps: true })
export class WithdrawalRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  /** Requested amount in KOBO. */
  @Prop({ type: Number, required: true, min: 1 })
  amount: number;

  @Prop({
    type: String,
    enum: WithdrawalStatus,
    required: true,
    default: WithdrawalStatus.Pending,
    index: true,
  })
  status: WithdrawalStatus;

  // ─── Bank details (where the offline payout should go) ───────────────
  @Prop({ type: String, default: null })
  bankName?: string;

  @Prop({ type: String, default: null })
  accountNumber?: string;

  @Prop({ type: String, default: null })
  accountName?: string;

  /** The wallet ledger row (the hold debit) created for this request. */
  @Prop({ type: Types.ObjectId, ref: 'WalletTransaction', default: null })
  walletTxnId?: Types.ObjectId;

  /** Admin free-form note (e.g. rejection reason / payout reference). */
  @Prop({ type: String, default: null })
  adminNote?: string;

  @Prop({ type: Date, default: Date.now })
  requestedAt: Date;

  @Prop({ type: Date, default: null })
  processedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  processedBy?: Types.ObjectId;
}

export const WithdrawalRequestSchema =
  SchemaFactory.createForClass(WithdrawalRequest);

// Newest-first listing per user and for the admin queue.
WithdrawalRequestSchema.index({ userId: 1, createdAt: -1 });
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });
