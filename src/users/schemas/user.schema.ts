/**
 * users/schemas/user.schema.ts - User Database Model
 * =====================================================
 * This defines the SHAPE of a User document in MongoDB.
 *
 * In NestJS + Mongoose, we define schemas using decorators:
 *   @Schema()  → marks the class as a Mongoose schema
 *   @Prop()    → marks a field as a database column
 *
 * Think of this like a blueprint: every user in the database will have
 * these fields. Mongoose enforces the types at the database level.
 *
 * KEY DESIGN DECISION: The User schema handles basic account info.
 * Creator profiles and Stores are SEPARATE collections (schemas) that
 * reference the User via userId. This keeps things clean:
 *
 *   User (account)
 *     ↓ upgrades to
 *   Creator (profile, linked by userId)
 *     ↓ creates
 *   Store (shop, linked by creatorId)
 *     ↓ has
 *   Listing (product, linked by storeId)
 *
 * The `role` field on User tracks whether they've upgraded to creator/admin,
 * while the actual creator profile data lives in its own collection.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude } from 'class-transformer';
import { AuthProvider, UserRole } from '@config/contants';
import { BaseSchema } from '@common/schemas/base-schema';

// ─────────────────────────────────────────────────────────────
// Type: Combines the User class with Mongoose's Document class.
// This gives you both your custom fields AND Mongoose methods
// like .save(), .toObject(), .populate(), etc.
// ─────────────────────────────────────────────────────────────
export type UserDocument = User & Document;

// ─────────────────────────────────────────────────────────────
// Embedded sub-document for phone number.
// Not a separate collection — just a nested object inside User.
// ─────────────────────────────────────────────────────────────
class Mobile {
  phoneNumber: string;
  isoCode: string;
}

// ─────────────────────────────────────────────────────────────
// Embedded sub-document for a registered push-notification device
// token (FCM). One user may have several (phone, tablet, web).
// ─────────────────────────────────────────────────────────────
class PushToken {
  token: string;
  platform: string;
  updatedAt: Date;
}

@Schema({
  timestamps: true, // Auto-adds createdAt and updatedAt fields
  toJSON: {
    // Controls what happens when you call user.toJSON() or JSON.stringify(user)
    virtuals: true, // Include virtual fields (like 'id')
    transform: (_, ret) => {
      delete ret.password; // NEVER send password to the client
      delete ret.__v; // Remove Mongoose version key (noise)
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
})
export class User extends BaseSchema {
  // ─── Basic Info ──────────────────────────────────────────

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true, // Always store email in lowercase
    trim: true,
  })
  email: string;

  @Prop({ required: false, select: false }) // select: false = don't include in queries by default
  @Exclude() // Extra safety: class-transformer will also strip this
  password?: string;

  @Prop({ type: String, default: null })
  avatar?: string;

  // ─── Contact ─────────────────────────────────────────────

  @Prop({
    type: {
      phoneNumber: { type: String },
      isoCode: { type: String, default: 'NG' },
    },
    default: null,
  })
  mobile?: Mobile;

  // ─── Role & Auth ─────────────────────────────────────────

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.User,
  })
  role: UserRole;

  @Prop({
    type: String,
    enum: Object.values(AuthProvider),
    default: AuthProvider.Local,
  })
  authProvider: AuthProvider;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: false })
  isSuspended: boolean;

  // ─── Phone Verification (SMS OTP) ────────────────────────
  // Separate from `mobile` (which is free-form contact info). These are only
  // set once the number has passed SMS OTP verification. `phoneE164` is the
  // normalized +234... form and is indexed for the "one account per phone"
  // uniqueness checks. Reward eligibility is gated on isPhoneVerified.

  @Prop({ default: false })
  isPhoneVerified: boolean;

  @Prop({ type: String, default: null, index: true })
  phoneE164?: string;

  @Prop({ type: Date, default: null })
  phoneVerifiedAt?: Date;

  // ─── Referrals ───────────────────────────────────────────
  // `referralCode` is this user's OWN short code that they share. It is
  // generated for every new user and lazily backfilled on read for legacy
  // accounts (see UsersService.findById). `referredBy` points at the user
  // whose code was used when THIS user signed up. Reward eligibility is gated
  // on phone verification (see the referrals module + anti-farm registry).

  @Prop({ type: String, default: null, unique: true, sparse: true, index: true })
  referralCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  referredBy?: Types.ObjectId;

  // ─── Affiliate Program ───────────────────────────────────
  // Opt-in flag. An affiliate can share per-product affiliate links (using the
  // same `referralCode` above) and earn commission on referred purchases.

  @Prop({ type: Boolean, default: false })
  isAffiliate: boolean;

  // ─── Personal Details ────────────────────────────────────

  @Prop({ enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  gender?: string;

  @Prop()
  dateOfBirth?: string;

  @Prop()
  country?: string;

  @Prop()
  state?: string;

  @Prop()
  city?: string;

  @Prop()
  bio?: string;

  // ─── Email Verification ──────────────────────────────────
  // OTP-based verification (same approach as your Redymit app)

  @Prop({ select: false })
  verificationCode?: string;

  @Prop({ type: Date, select: false })
  verificationExpires?: Date;

  // ─── Notification Preferences ───────────────────────

  @Prop({
    type: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
    },
    default: {
      emailNotifications: true,
      pushNotifications: true,
      orderUpdates: true,
      promotions: false,
    },
  })
  notificationPreferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    orderUpdates: boolean;
    promotions: boolean;
  };

  // ─── Push Notification Device Tokens ─────────────────────
  // FCM registration tokens for this user's devices. Deduped by token.

  @Prop({
    type: [
      {
        token: { type: String, required: true },
        platform: { type: String, default: 'web' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  pushTokens: PushToken[];

  // ─── Password Reset ──────────────────────────────────────

  @Prop({ select: false })
  passwordResetToken?: string;

  @Prop({ type: Date, select: false })
  passwordResetExpires?: Date;

  // ─── Withdrawals: saved payout bank accounts ─────────────
  // Verified (via Paystack) bank accounts the user saved for faster future
  // withdrawals. accountName is the Paystack-resolved holder name.
  @Prop({
    type: [
      {
        bankName: { type: String, required: true },
        bankCode: { type: String, required: true },
        accountNumber: { type: String, required: true },
        accountName: { type: String, required: true },
      },
    ],
    default: [],
  })
  savedBankAccounts: {
    _id?: Types.ObjectId;
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }[];

  // ─── Withdrawals: email OTP gate ─────────────────────────
  // A 6-digit code emailed before a user can open the withdrawal view. Hashed.
  @Prop({ select: false })
  withdrawalOtpHash?: string;

  @Prop({ type: Date, select: false })
  withdrawalOtpExpires?: Date;

  @Prop({ type: Number, select: false, default: 0 })
  withdrawalOtpAttempts?: number;
}

// ─────────────────────────────────────────────────────────────
// SchemaFactory.createForClass() converts the decorated class
// into an actual Mongoose schema that can be used with MongoDB.
// ─────────────────────────────────────────────────────────────
export const UserSchema = SchemaFactory.createForClass(User);

// ─────────────────────────────────────────────────────────────
// Index: Makes email lookups fast. unique: true also prevents
// duplicate emails at the database level (belt AND suspenders
// with the validation in the service layer).
// ─────────────────────────────────────────────────────────────
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
// Fast lookups for the "one verified account per phone" enforcement.
UserSchema.index({ phoneE164: 1 });
// Referral code lookups (unique, but sparse so legacy null codes don't clash).
UserSchema.index({ referralCode: 1 }, { unique: true, sparse: true });