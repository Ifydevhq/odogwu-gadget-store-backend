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

  /** sha256(code:phone:pepper) — never store the raw code. */
  @Prop({ required: true })
  codeHash: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;
}

export const OtpChallengeSchema = SchemaFactory.createForClass(OtpChallenge);

// Auto-purge expired challenges (Mongo removes docs once expiresAt is in the past).
OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
