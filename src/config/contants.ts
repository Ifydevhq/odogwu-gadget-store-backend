/**
 * config/constants.ts - Application Constants & Enums
 * =====================================================
 * All the shared enums and constants used across the app.
 * Having them in one place means:
 * - No magic strings scattered in your code
 * - If a value changes, you update it in ONE place
 * - TypeScript gives you autocomplete and type checking
 *
 * Example: Instead of writing status: 'pending' (easy to typo as 'pnding'),
 * you write status: ListingStatus.Pending (TypeScript catches mistakes).
 */

// ═══════════════════════════════════════════════════════════════════
// USER & AUTH
// ═══════════════════════════════════════════════════════════════════

/** Base roles for all users */
export enum UserRole {
  User = 'user',
  Creator = 'creator',
  Admin = 'admin',
  SuperAdmin = 'super_admin',
}

/** How the user signed up */
export enum AuthProvider {
  Local = 'local', // Email + password
  Google = 'google',
}

// ═══════════════════════════════════════════════════════════════════
// CREATOR
// ═══════════════════════════════════════════════════════════════════

/** Creator subscription plans */
export enum CreatorPlan {
  Starter = 'starter', // Free
  Pro = 'pro', // ₦3,000/mo
  Business = 'business', // ₦8,000/mo
}

/** Creator account status */
export enum CreatorStatus {
  Active = 'active',
  Suspended = 'suspended',
  Deactivated = 'deactivated',
}

// ═══════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════

export enum StoreStatus {
  Active = 'active',
  Suspended = 'suspended',
  Closed = 'closed',
  PendingApproval = 'pending_approval',
}

// ═══════════════════════════════════════════════════════════════════
// LISTINGS (PRODUCTS)
// ═══════════════════════════════════════════════════════════════════

/**
 * The 3 selling types — this is the CORE of Comaket's business model:
 *
 * SelfListing: Seller lists item, handles the sale themselves.
 *   - Pays a listing fee to Comaket
 *   - Buyers contact seller via WhatsApp
 *   - NOT buyable on platform (isBuyable = false)
 *
 * Consignment: Seller hands the item to Comaket to sell.
 *   - Comaket sets the selling price and takes a commission
 *   - Revenue split between Comaket and seller
 *   - BUYABLE on platform (isBuyable = true)
 *
 * DirectPurchase: Comaket buys the item outright from the seller.
 *   - Comaket owns the item and resells it
 *   - Full control over pricing
 *   - BUYABLE on platform (isBuyable = true)
 */
export enum ListingType {
  SelfListing = 'self_listing',
  Consignment = 'consignment',
  DirectPurchase = 'direct_purchase',
  Admin = 'admin', // Admin-created listing (purchasable on app, like consignment)
}

export enum ListingStatus {
  Draft = 'draft',
  InReview = 'in_review', // All types: initial state after submission
  Approved = 'approved', // All types: passed review (transitional)
  Rejected = 'rejected', // All types: failed review or rejected
  AwaitingFee = 'awaiting_fee', // Self-listing: approved, waiting for listing fee payment
  AwaitingProduct = 'awaiting_product', // Consignment/Direct: waiting for physical product
  PriceOffered = 'price_offered', // Direct purchase: platform has made a bid
  CounterOffer = 'counter_offer', // Direct purchase: seller sent a counter-offer
  Live = 'live', // Visible on marketplace
  Sold = 'sold', // Item has been sold
  SoldToPlatform = 'sold_to_platform', // Direct purchase: product received by platform, listing complete
  Suspended = 'suspended', // Admin took it down
  Expired = 'expired', // TTL expired
  Delisted = 'delisted', // Seller removed from marketplace
}

/** @deprecated Use ListingStatus.InReview instead */
export const PendingApproval = ListingStatus.InReview;

export enum ItemCondition {
  BrandNew = 'brand_new',
  FairlyUsed = 'fairly_used',
  Refurbished = 'refurbished',
}

// ═══════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════

export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

// ═══════════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════════

export enum PaymentStatus {
  Pending = 'pending',
  Processing = 'processing',
  Success = 'success',
  Failed = 'failed',
  Refunded = 'refunded',
}

export enum DisbursementStatus {
  AwaitingCompletion = 'awaiting_completion',
  AwaitingDisbursement = 'awaiting_disbursement',
  Disbursed = 'disbursed',
  NotApplicable = 'not_applicable', // direct_purchase (platform owns the item, no seller payout)
}

export enum PaymentType {
  ProductPurchase = 'product_purchase',
  ListingFee = 'listing_fee', // For self-listing sellers
  Subscription = 'subscription', // Creator plan subscription
  Payout = 'payout', // Pay seller after sale
}

export enum Currency {
  NGN = 'NGN',
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════

export enum NotificationType {
  ListingApproved = 'listing_approved',
  ListingRejected = 'listing_rejected',
  NewOrder = 'new_order',
  OrderStatusUpdate = 'order_status_update',
  PaymentReceived = 'payment_received',
  PayoutSent = 'payout_sent',
  NewReview = 'new_review',
  SystemAlert = 'system_alert',
}

// ═══════════════════════════════════════════════════════════════════
// IN-APP ALERTS
// ═══════════════════════════════════════════════════════════════════

export enum AlertType {
  // Auth & Account
  Welcome = 'welcome',
  ProfileUpdated = 'profile_updated',

  // Orders — Buyer
  OrderPlaced = 'order_placed',
  OrderConfirmed = 'order_confirmed',
  OrderProcessing = 'order_processing',
  OrderShipped = 'order_shipped',
  OrderDelivered = 'order_delivered',
  OrderCompleted = 'order_completed',
  OrderCancelled = 'order_cancelled',
  OrderRefunded = 'order_refunded',

  // Orders — Seller
  NewOrderReceived = 'new_order_received',

  // Affiliate & Referral
  AffiliateSale = 'affiliate_sale',
  ReferralJoined = 'referral_joined',

  // Listings
  ListingSubmitted = 'listing_submitted',
  ListingApproved = 'listing_approved',
  ListingRejected = 'listing_rejected',
  ListingLive = 'listing_live',
  ListingSold = 'listing_sold',
  ListingSoldToPlatform = 'listing_sold_to_platform',

  // Payments
  PaymentSuccessful = 'payment_successful',
  PaymentFailed = 'payment_failed',

  // Store
  StoreCreated = 'store_created',
  StoreVerified = 'store_verified',

  // Follows
  NewFollower = 'new_follower',

  // Reviews
  NewReview = 'new_review',

  // Disputes
  DisputeSubmitted = 'dispute_submitted',
  DisputeResolved = 'dispute_resolved',

  // System
  SystemAnnouncement = 'system_announcement',
}

// ═══════════════════════════════════════════════════════════════════
// PLATFORM DEFAULTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Default commission rates (in percentage).
 * Admin can override these per listing from the admin portal.
 */
export const DEFAULT_COMMISSION_RATES = {
  [ListingType.SelfListing]: 5, // 5% listing fee
  [ListingType.Consignment]: 15, // 15% commission
  [ListingType.DirectPurchase]: 0, // N/A — Comaket owns the item
} as const;

/**
 * Creator plan pricing in kobo (1 Naira = 100 kobo).
 * Same as what we set up in the frontend.
 */
export const PLAN_PRICING = {
  [CreatorPlan.Starter]: 0,
  [CreatorPlan.Pro]: 300000, // ₦3,000
  [CreatorPlan.Business]: 800000, // ₦8,000
} as const;

/**
 * Plan-based limits.
 * Featured works are portfolio/showcase images on creator or store profiles.
 */
export const PLAN_LIMITS = {
  stores: {
    [CreatorPlan.Starter]: 1,
    [CreatorPlan.Pro]: 3,
    [CreatorPlan.Business]: Infinity,
  },
  featuredWorks: {
    [CreatorPlan.Starter]: 0, // Not available on Starter
    [CreatorPlan.Pro]: 10,
    [CreatorPlan.Business]: 25,
  },
} as const;