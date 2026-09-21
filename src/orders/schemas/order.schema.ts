/**
 * orders/schemas/order.schema.ts - Order Database Model
 * ========================================================
 * An Order is created when a buyer purchases a BUYABLE listing
 * (consignment or direct_purchase). Self-listed items can't be
 * ordered — buyers contact sellers via WhatsApp instead.
 *
 * ORDER FLOW:
 *
 *   Buyer clicks "Buy Now" on a listing
 *     ↓
 *   Order created with status: PENDING
 *     ↓
 *   Buyer is redirected to Paystack payment page
 *     ↓
 *   Payment succeeds → Order status: CONFIRMED
 *     ↓
 *   Comaket processes the order:
 *     → PROCESSING: Item being prepared/packaged
 *     → SHIPPED: Item sent out (with tracking info)
 *     → DELIVERED: Item received by buyer
 *     → COMPLETED: Order finalized
 *     ↓
 *   Or if something goes wrong:
 *     → CANCELLED: Buyer/admin cancels before shipping
 *     → REFUNDED: Payment returned to buyer
 *
 * REVENUE SPLIT (calculated at order creation):
 *   Consignment:
 *     sellingPrice × commissionRate% → Comaket (commission)
 *     sellingPrice × (100 - commissionRate)% → Seller (payout)
 *
 *   Direct Purchase:
 *     sellingPrice → Comaket (they own the item)
 *     (purchasePrice was already paid to seller when item was acquired)
 *
 * All monetary amounts are stored in KOBO (1 Naira = 100 kobo).
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// import { BaseSchema } from '@common/schemas/base.schema';

import { BaseSchema } from '@common/schemas/base-schema';
import {
  OrderStatus,
  PaymentStatus,
  ListingType,
  Currency,
} from '@config/contants';

export type OrderDocument = Order & Document;

// ─── Embedded sub-documents ─────────────────────────────────

class OrderItem {
  listingId: Types.ObjectId;
  itemName: string;
  quantity: number;
  unitPrice: number; // Price per item in kobo
  totalPrice: number; // unitPrice × quantity
  type: string; // ListingType
  image?: string; // First image from listing media
  storeId: Types.ObjectId; // Which store this item belongs to
  sellerId: Types.ObjectId; // Who listed it
  creatorId: Types.ObjectId; // The creator profile
  commissionRate: number; // Commission % for revenue split
}

class ShippingAddress {
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
}

class PaymentInfo {
  method: string; // 'paystack'
  reference?: string; // Paystack payment reference
  paystackReference?: string; // Paystack transaction ref
  paidAt?: Date;
  status: string;
}

class RevenueSplit {
  totalAmount: number; // What buyer paid (in kobo)
  platformFee: number; // Comaket's cut (in kobo)
  sellerPayout: number; // What seller receives (in kobo)
  commissionRate: number; // Percentage applied
}

class TrackingInfo {
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Order extends BaseSchema {
  // ─── Order Number ────────────────────────────────────────
  // Human-readable order number: "CMK-20260220-A3F2"

  @Prop({ required: true, unique: true })
  orderNumber: string;

  // ─── Parties ─────────────────────────────────────────────

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyerId: Types.ObjectId; // Who's buying

  @Prop({ type: String, default: null })
  receiptEmail: string | null; // Override email for receipts (from checkout)

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  sellerId: Types.ObjectId | null; // Set if single-seller order, null if multi-store

  @Prop({ type: Types.ObjectId, ref: 'Creator', default: null })
  creatorId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Store', default: null })
  storeId: Types.ObjectId | null;

  // ─── Items ───────────────────────────────────────────────
  // Each item tracks its own store/seller for multi-store checkouts.

  @Prop({
    type: [
      {
        listingId: { type: Types.ObjectId, ref: 'Listing', required: true },
        itemName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        type: { type: String, enum: Object.values(ListingType) },
        image: { type: String },
        storeId: { type: Types.ObjectId, ref: 'Store' },
        sellerId: { type: Types.ObjectId, ref: 'User' },
        creatorId: { type: Types.ObjectId, ref: 'Creator' },
        commissionRate: { type: Number, default: 15 },
      },
    ],
    required: true,
  })
  items: OrderItem[];

  // ─── Pricing ─────────────────────────────────────────────

  @Prop({ type: Number, required: true })
  subtotal: number; // Sum of all item totalPrices (kobo)

  @Prop({ type: Number, default: 0 })
  shippingFee: number; // In kobo

  @Prop({ type: Number, default: 0 })
  discount: number; // In kobo

  @Prop({ type: Number, required: true })
  totalAmount: number; // subtotal + shippingFee - discount (kobo)

  @Prop({ type: String, default: Currency.NGN })
  currency: string;

  // ─── Revenue Split ───────────────────────────────────────

  @Prop({
    type: {
      totalAmount: { type: Number, required: true },
      platformFee: { type: Number, required: true },
      sellerPayout: { type: Number, required: true },
      commissionRate: { type: Number, required: true },
    },
    required: true,
  })
  revenueSplit: RevenueSplit;

  // ─── Status ──────────────────────────────────────────────

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.Pending,
  })
  status: OrderStatus;

  // ─── Payment ─────────────────────────────────────────────

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.Pending,
  })
  paymentStatus: PaymentStatus;

  // ─── Disbursement (seller payout tracking) ────────────────

  @Prop({
    type: String,
    enum: [
      'awaiting_completion',
      'awaiting_disbursement',
      'disbursed',
      'not_applicable',
    ],
    default: 'awaiting_completion',
  })
  disbursementStatus: string;

  @Prop({ type: Date, default: null })
  disbursedAt?: Date;

  @Prop({
    type: {
      method: { type: String, default: 'paystack' },
      reference: { type: String },
      paystackReference: { type: String },
      paidAt: { type: Date },
      status: { type: String },
    },
    default: {},
  })
  paymentInfo: PaymentInfo;

  // ─── Shipping ────────────────────────────────────────────

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
  shippingAddress: ShippingAddress;

  @Prop({
    type: {
      carrier: { type: String },
      trackingNumber: { type: String },
      estimatedDelivery: { type: Date },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
    },
    default: {},
  })
  trackingInfo: TrackingInfo;

  // ─── Notes ───────────────────────────────────────────────

  @Prop({ type: String, default: null })
  buyerNote?: string; // Special instructions from buyer

  @Prop({ type: String, default: null })
  adminNote?: string; // Internal notes

  @Prop({ type: String, default: null })
  cancellationReason?: string;

  // ─── Wallet credit redemption (opt-in) ───────────────────
  // How much store credit (kobo) was applied to reduce what the buyer
  // pays to the provider / on delivery. 0 (default) means no credit used —
  // byte-for-byte unchanged from the pre-wallet behaviour.

  @Prop({ type: Number, default: 0 })
  walletCreditApplied?: number;

  // Split of the applied credit across buckets (kobo).
  @Prop({
    type: {
      promo: { type: Number, default: 0 },
      earned: { type: Number, default: 0 },
    },
    default: null,
  })
  walletCreditBreakdown?: { promo: number; earned: number };

  // Primary wallet ledger row for the redemption debit (for tracking).
  // Reversal reverses ALL purchase_redemption rows for this order via
  // WalletService.reverseOrderRedemptions(), so it is robust to the
  // two-bucket (promo + earned) case.
  @Prop({ type: Types.ObjectId, default: null })
  walletRedemptionTxnId?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// ─── Indexes ─────────────────────────────────────────────────

OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ buyerId: 1, status: 1 }); // Buyer's orders
OrderSchema.index({ sellerId: 1, status: 1 }); // Seller's orders (single-seller)
OrderSchema.index({ 'items.sellerId': 1, status: 1 }); // Seller's orders (multi-store)
OrderSchema.index({ 'items.storeId': 1 }); // Orders by store
OrderSchema.index({ storeId: 1 });
OrderSchema.index({ creatorId: 1 });
OrderSchema.index({ status: 1, createdAt: -1 }); // Admin: filter by status
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ disbursementStatus: 1 }); // Admin: track pending payouts
OrderSchema.index({ 'items.sellerId': 1, disbursementStatus: 1 }); // Seller: my payouts
OrderSchema.index({ 'paymentInfo.reference': 1 }); // Paystack webhook lookup
OrderSchema.index({ status: 1, 'trackingInfo.deliveredAt': 1 }); // Cron: auto-complete delivered orders
