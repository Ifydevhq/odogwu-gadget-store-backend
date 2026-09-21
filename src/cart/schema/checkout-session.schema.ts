/**
 * cart/schemas/checkout-session.schema.ts - Checkout Session
 * =============================================================
 * A temporary document created at checkout that holds everything
 * needed to create orders AFTER payment is confirmed.
 *
 * LIFECYCLE:
 *   1. User clicks checkout → session created with status 'pending'
 *   2. User is redirected to Paystack
 *   3a. Payment succeeds → orders created, session marked 'completed', cart items removed
 *   3b. Payment fails → session marked 'failed', cart untouched
 *   3c. User abandons → session expires via TTL (30 min), cart untouched
 *
 * WHY THIS EXISTS:
 *   We don't create orders until payment is confirmed. This avoids
 *   orphaned "pending" orders when users cancel or abandon payment.
 *   Orders only exist when money has actually landed.
 *
 * AUTO-EXPIRY:
 *   MongoDB TTL index deletes sessions 30 minutes after creation.
 *   Completed/failed sessions are kept for 24 hours for debugging.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CheckoutSessionDocument = CheckoutSession & Document;

// ─── Embedded types ─────────────────────────────────────────

class SessionItem {
  listingId: string;
  storeId: string;
  sellerId: string;
  creatorId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: string;
  image: string | null;
  commissionRate: number;
}

class SessionShippingAddress {
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class CheckoutSession {
  // ─── Buyer ────────────────────────────────────────────────

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyerId: Types.ObjectId;

  @Prop({ type: String, required: true })
  email: string;

  // ─── Validated items snapshot ─────────────────────────────

  @Prop({
    type: [
      {
        listingId: { type: String, required: true },
        storeId: { type: String, required: true },
        sellerId: { type: String, required: true },
        creatorId: { type: String, required: true },
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        type: { type: String, required: true },
        image: { type: String, default: null },
        commissionRate: { type: Number, required: true },
      },
    ],
    required: true,
  })
  items: SessionItem[];

  // ─── Shipping ─────────────────────────────────────────────

  @Prop({
    type: {
      fullName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'Nigeria' },
      zipCode: { type: String },
    },
    required: true,
  })
  shippingAddress: SessionShippingAddress;

  @Prop({ type: String, default: null })
  buyerNote?: string;

  // ─── Affiliate attribution (listingId -> affiliate code) ──
  // Carried from checkout to fulfilment so commission can be snapshotted onto
  // the order items once payment confirms.
  @Prop({ type: Object, default: null })
  affiliateCodes?: Record<string, string>;

  // ─── Totals ───────────────────────────────────────────────

  @Prop({ type: Number, required: true })
  grandTotal: number;

  @Prop({ type: Number, default: 0 })
  deliveryFee: number;

  @Prop({ type: String, default: 'NGN' })
  currency: string;

  // ─── Wallet credit (opt-in) ───────────────────────────────
  // Intended store credit to apply once payment confirms. The provider is
  // charged `grandTotal` (already reduced by walletCreditApplied). The wallet
  // is NOT debited here — the debit happens in OrdersService.confirmPayment
  // after the money lands, so an abandoned/failed session never touches the
  // wallet.

  @Prop({ type: Number, default: 0 })
  walletCreditApplied: number;

  @Prop({
    type: {
      promo: { type: Number, default: 0 },
      earned: { type: Number, default: 0 },
    },
    default: null,
  })
  walletCreditBreakdown?: { promo: number; earned: number };

  // ─── Payment ──────────────────────────────────────────────

  @Prop({ type: String, enum: ['paystack', 'opay'], default: 'paystack' })
  paymentMethod: string;

  @Prop({ type: String, required: true })
  paymentReference: string;

  // ─── Status ───────────────────────────────────────────────

  @Prop({
    type: String,
    enum: ['pending', 'completed', 'failed', 'expired'],
    default: 'pending',
  })
  status: string;

  // ─── Result (populated after payment) ─────────────────────

  @Prop({ type: [String], default: [] })
  orderIds: string[];

  // ─── TTL expiry ───────────────────────────────────────────
  // Pending sessions expire after 30 min.
  // Completed/failed sessions have expiresAt pushed to 24h for debugging.

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const CheckoutSessionSchema =
  SchemaFactory.createForClass(CheckoutSession);

// TTL index — MongoDB auto-deletes documents when expiresAt passes
CheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Quick lookup by payment reference (webhook/verify)
CheckoutSessionSchema.index({ paymentReference: 1 });

// Find active sessions for a user
CheckoutSessionSchema.index({ buyerId: 1, status: 1 });