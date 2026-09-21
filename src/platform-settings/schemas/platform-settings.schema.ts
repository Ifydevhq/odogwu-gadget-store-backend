/**
 * platform-settings/schemas/platform-settings.schema.ts
 * ========================================================
 * Singleton document that stores admin-configurable platform settings.
 * Only ONE document should ever exist (keyed by `key: 'platform'`).
 *
 * These values override the env-based defaults in app.config.ts.
 * If a field is null/undefined, the service falls back to env defaults.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlatformSettingsDocument = HydratedDocument<PlatformSettings>;

@Schema({ timestamps: true })
export class PlatformSettings {
  /**
   * Singleton key — always 'platform'. Ensures only one settings doc exists.
   */
  @Prop({ type: String, default: 'platform', unique: true })
  key: string;

  // ─── Listing Fee Settings ──────────────────────────────────────

  /** If true, self-listing fees are waived (equivalent to FREE_LISTING env var) */
  @Prop({ type: Boolean, default: false })
  freeListing: boolean;

  /** If true, consignment commissions are waived (equivalent to NO_COMMISSION env var) */
  @Prop({ type: Boolean, default: false })
  noCommission: boolean;

  /** Self-listing fee percentage (default 5%) */
  @Prop({ type: Number, default: 5 })
  selfListingFeePercent: number;

  /** Consignment commission percentage (default 15%) */
  @Prop({ type: Number, default: 15 })
  consignmentCommissionPercent: number;

  /** Max listing fee in kobo (default ₦5,000 = 500000 kobo) */
  @Prop({ type: Number, default: 500000 })
  listingFeeCapKobo: number;

  /** Max consignment commission in kobo (default ₦20,000 = 2000000 kobo) */
  @Prop({ type: Number, default: 2000000 })
  consignmentCommissionCapKobo: number;

  // ─── Feature Flags ─────────────────────────────────────────────

  @Prop({ type: Boolean, default: true })
  selfListingEnabled: boolean;

  @Prop({ type: Boolean, default: true })
  consignmentEnabled: boolean;

  @Prop({ type: Boolean, default: true })
  directSaleEnabled: boolean;

  @Prop({ type: Boolean, default: false })
  autoApproveVerified: boolean;

  @Prop({ type: Boolean, default: false })
  maintenanceMode: boolean;

  // ─── Creator Plan Pricing (in kobo) ────────────────────────────

  /** Starter plan price — always 0 (free) */
  @Prop({ type: Number, default: 0 })
  starterPlanPriceKobo: number;

  /** Pro plan monthly price in kobo (default ₦3,000 = 300000) */
  @Prop({ type: Number, default: 300000 })
  proPlanPriceKobo: number;

  /** Business plan monthly price in kobo (default ₦8,000 = 800000) */
  @Prop({ type: Number, default: 800000 })
  businessPlanPriceKobo: number;

  /** If false, the Starter plan won't show in plan selection */
  @Prop({ type: Boolean, default: true })
  starterPlanActive: boolean;

  /** If false, the Pro plan won't show in plan selection */
  @Prop({ type: Boolean, default: true })
  proPlanActive: boolean;

  /** If false, the Business plan won't show in plan selection */
  @Prop({ type: Boolean, default: true })
  businessPlanActive: boolean;

  // ─── General ────────────────────────────────────────────────────

  @Prop({ type: Number, default: 50000 })
  minListingPriceKobo: number;

  @Prop({ type: Number, default: 10 })
  maxListingImages: number;

  /** Max file upload size in bytes (default 15MB = 15728640) */
  @Prop({ type: Number, default: 15 * 1024 * 1024 })
  maxFileSizeBytes: number;

  /** Max number of files per listing upload (default 10) */
  @Prop({ type: Number, default: 10 })
  maxFilesPerUpload: number;

  /** Max hours a buyer has to return before the order auto-completes (default 72h) */
  @Prop({ default: 72 })
  maxReturnHoursBeforeAutoComplete: number;

  // ─── Wallet / Store-Credit Settings ────────────────────────────

  /** Welcome/promo credit granted per verified phone, in kobo (₦2,000). */
  @Prop({ type: Number, default: 200000 })
  welcomeCreditAmount: number;

  /** Max % of an order payable from PROMO credit (default 20%). */
  @Prop({ type: Number, default: 20 })
  creditMaxPercentPerOrder: number;

  /** Cumulative completed spend by a referee that triggers the referrer reward, in kobo (default ₦10,000). */
  @Prop({ type: Number, default: 1000000 })
  referralMinOrderAmount: number;

  /** Referrer reward amount, in kobo (default ₦1,000). */
  @Prop({ type: Number, default: 100000 })
  referralRewardAmount: number;

  /** Days an affiliate commission stays pending before maturing (default 7). */
  @Prop({ type: Number, default: 7 })
  affiliateHoldDays: number;

  /** Optional default affiliate commission % (default 0). */
  @Prop({ type: Number, default: 0 })
  affiliateDefaultCommissionPercent: number;

  /** Minimum wallet withdrawal request, in kobo (default ₦1,000). */
  @Prop({ type: Number, default: 100000 })
  minWithdrawalAmount: number;
}

export const PlatformSettingsSchema =
  SchemaFactory.createForClass(PlatformSettings);
