/**
 * listings/schemas/listing.schema.ts - Listing (Product) Database Model
 * =======================================================================
 * This is the CORE schema of Comaket — every item for sale is a Listing.
 *
 * THE 3 SELLING TYPES (recap):
 *
 * 1. SELF LISTING
 *    - Seller lists item, handles the sale themselves via WhatsApp
 *    - Pays a listing fee to Comaket
 *    - isBuyable = FALSE (can't buy on platform, only contact seller)
 *    - Frontend shows: "WhatsApp" button
 *
 * 2. CONSIGNMENT
 *    - Seller hands item to Comaket to sell on their behalf
 *    - Comaket sets the selling price, takes a commission
 *    - Revenue split: (sellingPrice - commission) → seller, commission → Comaket
 *    - isBuyable = TRUE (buyable on platform)
 *    - Frontend shows: "Buy Now" / "Add to Cart" buttons
 *
 * 3. DIRECT PURCHASE
 *    - Comaket buys the item outright from the seller
 *    - Comaket owns it and resells at their own price
 *    - isBuyable = TRUE (buyable on platform)
 *    - Frontend shows: "Buy Now" / "Add to Cart" buttons
 *
 * THE isBuyable LOGIC:
 *   isBuyable = (type === 'consignment' || type === 'direct_purchase')
 *               && status === 'live'
 *
 * This is computed as a Mongoose virtual field — it's not stored in the
 * database, it's calculated on-the-fly whenever you read a listing.
 *
 * PRICE MODEL (stored in kobo, 1 Naira = 100 kobo):
 *   - askingPrice: What the seller wants (all types)
 *   - sellingPrice: What Comaket actually sells it for (consignment/direct)
 *   - purchasePrice: What Comaket paid the seller (direct purchase only)
 *   - commissionRate: Percentage Comaket takes (consignment)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  ListingType,
  ListingStatus,
  ItemCondition,
  Currency,
} from '@config/contants';
import { BaseSchema } from '@common/schemas/base-schema';

export type ListingDocument = Listing & Document;

// ─── Embedded sub-documents ─────────────────────────────────

class PriceInfo {
  amount: number; // In kobo
  currency: string;
  negotiable: boolean;
}

class MediaItem {
  url: string;
  type: string; // 'image' | 'video'
  thumbnail?: string; // For videos
}

class AdminPricing {
  sellingPrice?: number; // Price Comaket sells at (consignment)
  purchasePrice?: number; // Price Comaket paid seller (direct purchase)
  commissionRate?: number; // Percentage (e.g., 15 means 15%)
}

class ReviewInfo {
  reviewedBy?: string; // Admin user ID
  reviewedAt?: Date;
  rejectionReason?: string;
  adminNotes?: string;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Listing extends BaseSchema {
  // ─── Ownership ───────────────────────────────────────────
  // A listing belongs to a Creator (always) and optionally to a Store.
  // If storeId is null, the listing is a "creator-level" product
  // not tied to any specific storefront.

  @Prop({ type: Types.ObjectId, ref: 'Store', default: null })
  storeId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Creator', required: true })
  creatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  // ─── Product Info ────────────────────────────────────────

  @Prop({ required: true, trim: true })
  itemName: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: Object.values(ItemCondition), required: true })
  condition: ItemCondition;

  @Prop({ type: String, default: null })
  category?: string;

  // Sub-category slug (e.g. category = 'laptops', subCategory = 'hp').
  // Lets buyers narrow a category down to a specific brand/type.
  @Prop({ type: String, default: null })
  subCategory?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Number, default: 1, min: 1 })
  quantity: number;

  // ─── Media ───────────────────────────────────────────────

  @Prop({
    type: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], default: 'image' },
        thumbnail: { type: String },
      },
    ],
    default: [],
    validate: {
      validator: (v: any[]) => v.length > 0,
      message: 'At least one image is required',
    },
  })
  media: MediaItem[];

  // ─── Selling Type ────────────────────────────────────────
  // This is THE key field — determines how the item is sold

  @Prop({
    type: String,
    enum: Object.values(ListingType),
    required: true,
  })
  type: ListingType;

  // ─── Pricing ─────────────────────────────────────────────
  // askingPrice: What the seller wants (set by seller, all types)
  // All prices in kobo (1 Naira = 100 kobo)

  @Prop({
    type: {
      amount: { type: Number, required: true },
      currency: { type: String, default: Currency.NGN },
      negotiable: { type: Boolean, default: false },
    },
    required: true,
  })
  askingPrice: PriceInfo;

  // ─── Admin Pricing (set by admin for consignment/direct purchase) ───

  @Prop({
    type: {
      sellingPrice: { type: Number }, // What Comaket sells it for
      purchasePrice: { type: Number }, // What Comaket paid seller (direct)
      commissionRate: { type: Number }, // Commission % (consignment)
    },
    default: null,
  })
  adminPricing?: AdminPricing;

  // ─── Discount Pricing (admin listings) ───────────────────
  // If set, askingPrice becomes the "former price" (struck through on marketplace)
  // and discountPrice becomes the actual selling price.
  // discountPercent is auto-calculated: ((askingPrice - discountPrice) / askingPrice) * 100

  @Prop({ type: Number, default: null })
  discountPrice?: number; // In kobo — the discounted price buyers pay

  @Prop({ type: Number, default: null })
  formerPrice?: number; // In kobo — original price before discount (copied from askingPrice)

  @Prop({ type: Number, default: null })
  discountPercent?: number; // e.g. 25 means 25% off

  // ─── Self-Listing Fee ────────────────────────────────────
  // Only for self_listing type — the fee the seller pays to list.
  //
  // FEE RECALCULATION ON PRICE UPDATE:
  //   listingFee     = Total fee for the CURRENT asking price (recalculated on update)
  //   feePaidAmount  = Cumulative amount paid so far
  //   Pending amount = listingFee - feePaidAmount (if positive)
  //
  //   Price increase → new listingFee > feePaidAmount → status = 'pending'
  //   Price decrease → feePaidAmount already covers it → status stays 'paid'

  @Prop({ type: Number, default: null })
  listingFee?: number; // In kobo — total fee for current price

  @Prop({ type: Number, default: 0 })
  feePaidAmount: number; // In kobo — how much has been paid so far

  @Prop({
    type: String,
    enum: ['pending', 'paid', 'waived', null],
    default: null,
  })
  listingFeeStatus?: string;

  @Prop({ type: Boolean, default: true })
  isExpectingFee: boolean; // false if FREE_LISTING=true or fee is 0

  // ─── Re-review Tracking ────────────────────────────────
  // When a live listing is edited, it goes back to in_review.
  // wasLive tells the admin this isn't a new listing — it was
  // previously approved and live.

  @Prop({ type: Boolean, default: false })
  wasLive: boolean;

  // ─── Direct Purchase Negotiation ──────────────────────────
  // Platform bid/counter-offer flow for direct_purchase type

  @Prop({ type: Number, default: null })
  platformBid?: number; // In kobo — what Comaket offers to buy the item for

  @Prop({ type: Number, default: null })
  counterOffer?: number; // In kobo — seller's counter to the platform bid

  // ─── Status & Review ─────────────────────────────────────

  @Prop({
    type: String,
    enum: Object.values(ListingStatus),
    default: ListingStatus.InReview,
  })
  status: ListingStatus;

  @Prop({
    type: {
      reviewedBy: { type: String },
      reviewedAt: { type: Date },
      rejectionReason: { type: String },
      adminNotes: { type: String },
    },
    default: null,
  })
  reviewInfo?: ReviewInfo;

  // ─── Location ────────────────────────────────────────────

  @Prop({
    type: {
      country: { type: String },
      state: { type: String },
      city: { type: String },
    },
    default: null,
  })
  location?: { country?: string; state?: string; city?: string };

  // ─── Contact (for self-listing — seller's WhatsApp) ──────

  @Prop({ type: String, default: null })
  whatsappNumber?: string;

  // ─── Expiry ──────────────────────────────────────────────
  // Listings can expire after a period (e.g., 30 days for Starter plan)

  @Prop({ type: Date, default: null })
  expiresAt?: Date;

  // ─── Stats ───────────────────────────────────────────────

  @Prop({ type: Number, default: 0 })
  views: number;

  @Prop({ type: Number, default: 0 })
  likes: number;

  @Prop({ type: Number, default: 0 })
  totalSales: number;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);

// ═══════════════════════════════════════════════════════════════
// VIRTUAL FIELDS
// ═══════════════════════════════════════════════════════════════
// Virtuals are fields that aren't stored in the database but are
// computed on-the-fly. They appear in JSON/Object output as if
// they were real fields.

/**
 * isBuyable — THE key computed field for the frontend.
 * Only consignment and direct_purchase items that are live can be bought.
 * Self-listed items can only be contacted via WhatsApp.
 */
ListingSchema.virtual('isBuyable').get(function () {
  const buyableTypes = [ListingType.Consignment, ListingType.DirectPurchase, ListingType.Admin];
  return buyableTypes.includes(this.type) && this.status === ListingStatus.Live;
});

/**
 * effectivePrice — The price shown to buyers.
 * For consignment/direct: admin's sellingPrice (if set), else askingPrice
 * For self-listing: askingPrice (informational only, since they can't buy)
 */
ListingSchema.virtual('effectivePrice').get(function () {
  // Discount price takes highest priority (admin listings with discount)
  if (this.discountPrice) {
    return {
      amount: this.discountPrice,
      currency: this.askingPrice?.currency || Currency.NGN,
    };
  }
  if (this.adminPricing?.sellingPrice) {
    return {
      amount: this.adminPricing.sellingPrice,
      currency: this.askingPrice?.currency || Currency.NGN,
    };
  }
  return {
    amount: this.askingPrice?.amount,
    currency: this.askingPrice?.currency || Currency.NGN,
  };
});

// ═══════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════

ListingSchema.index({ storeId: 1, status: 1 }); // Products in a store
ListingSchema.index({ creatorId: 1, status: 1 }); // All products by a creator
ListingSchema.index({ userId: 1 }); // All products by a user
ListingSchema.index({ type: 1, status: 1 }); // Filter by selling type + status
ListingSchema.index({ category: 1, status: 1 }); // Browse by category
ListingSchema.index({ category: 1, subCategory: 1, status: 1 }); // Browse by category + brand/sub-category
ListingSchema.index({ status: 1, createdAt: -1 }); // Latest listings
ListingSchema.index({ itemName: 'text', description: 'text', tags: 'text' }); // Search
ListingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-expire (TTL index)
