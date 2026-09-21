/**
 * phone-verification/schemas/otp-challenge.schema.ts
 * ==================================================
 * Server-side OTP store for providers (like WhatsApp) that only DELIVER a
 * message and do not manage the code themselves (unlike Twilio Verify).
 *
 * One challenge per phone number (unique). The stored code is hashed; a TTL
 * index auto-removes challenges shortly after they expire.
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OtpChallengeDocument = HydratedDocument<OtpChallenge>;

@Schema({ timestamps: true, collection: 'otp_challenges' })
export class OtpChallenge {
  @Prop({ required: true, unique: true, index: true })
  phoneE164: string;

  /**
   * sha256(code:phone:pepper) for providers that we verify ourselves (WhatsApp).
   * Not used when the provider manages the code (Termii pin id → providerRef).
   */
  @Prop({ default: null })
  codeHash: string | null;

  /**
   * Opaque reference from a provider that manages the code itself (e.g. Termii's
   * pinId), passed back on verify. Null for self-managed (WhatsApp) codes.
   */
  @Prop({ default: null })
  providerRef: string | null;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;
}

export const OtpChallengeSchema = SchemaFactory.createForClass(OtpChallenge);

// Auto-purge expired challenges (Mongo removes docs once expiresAt is in the past).
OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
