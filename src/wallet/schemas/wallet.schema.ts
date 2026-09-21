/**
 * wallet/schemas/wallet.schema.ts
 * ==================================
 * One document per user. Balances are CACHED AGGREGATES maintained by
 * WalletService — the append-only WalletTransaction ledger is the source of
 * truth. All amounts are stored in KOBO (₦1 = 100 kobo).
 *
 * - promoBalance   : welcome/promotional credit (spend-capped at checkout later)
 * - earnedBalance  : referral + affiliate earnings (not spend-capped)
 * - pendingBalance : rewards not yet matured (e.g. affiliate hold period)
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base-schema';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  /** Welcome/promotional credit in kobo (spend-capped at checkout). */
  @Prop({ type: Number, default: 0 })
  promoBalance: number;

  /** Referral + affiliate earnings in kobo (not capped). */
  @Prop({ type: Number, default: 0 })
  earnedBalance: number;

  /** Rewards not yet matured in kobo (e.g. affiliate hold). */
  @Prop({ type: Number, default: 0 })
  pendingBalance: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
