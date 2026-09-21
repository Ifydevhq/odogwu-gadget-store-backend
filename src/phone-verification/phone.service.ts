/**
 * phone-verification/phone.service.ts
 * ====================================
 * Orchestrates phone verification for the CURRENT user:
 *   1. request-otp  → normalize, guard uniqueness, send SMS code
 *   2. verify-otp   → normalize, check code, mark verified, upsert the
 *                     phone registry, grant the one-time welcome credit
 *
 * The "one welcome credit per phone number" guarantee lives in the
 * PhoneRegistry collection (keyed by phoneE164) PLUS the wallet's
 * idempotencyKey (`welcome:<phoneE164>`). Together they mean a reinstall or a
 * brand-new account using the same phone gets NOTHING a second time — even if
 * the registry flag were somehow missed, the idempotent credit would not
 * double-apply.
 */

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { WalletService } from '../wallet/wallet.service';
import {
  WalletBucket,
  WalletTxnType,
} from '../wallet/schemas/wallet-transaction.schema';
import {
  PhoneRegistry,
  PhoneRegistryDocument,
} from './schemas/phone-registry.schema';
import {
  SMS_VERIFICATION_PROVIDER,
  SmsVerificationProvider,
} from './sms-verification.provider';
import { normalizeNigerianPhone } from './phone.util';

@Injectable()
export class PhoneService {
  private readonly logger = new Logger(PhoneService.name);

  constructor(
    @Inject(SMS_VERIFICATION_PROVIDER)
    private readonly smsProvider: SmsVerificationProvider,
    @InjectModel(PhoneRegistry.name)
    private readonly phoneRegistryModel: Model<PhoneRegistryDocument>,
    private readonly usersService: UsersService,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * POST /auth/phone/request-otp
   * Normalizes the number, rejects it if another user has already verified it,
   * then sends the SMS code. `sendCode` throws ServiceUnavailable when Twilio
   * is not configured.
   */
  async requestOtp(
    userId: string,
    rawPhoneNumber: string,
  ): Promise<{ sent: true }> {
    const phoneE164 = normalizeNigerianPhone(rawPhoneNumber);

    const owner = await this.usersService.findVerifiedByPhoneE164(phoneE164);
    if (owner && owner._id.toString() !== userId) {
      throw new BadRequestException('This phone number is already in use');
    }

    await this.smsProvider.sendCode(phoneE164);

    return { sent: true };
  }

  /**
   * POST /auth/phone/verify-otp
   * Verifies the code, marks the user's phone verified, upserts the phone
   * registry and grants the one-time welcome credit.
   */
  async verifyOtp(
    userId: string,
    rawPhoneNumber: string,
    code: string,
  ): Promise<{ verified: true; welcomeGranted: boolean }> {
    const phoneE164 = normalizeNigerianPhone(rawPhoneNumber);

    // (a) Re-check uniqueness right before we commit anything.
    const owner = await this.usersService.findVerifiedByPhoneE164(phoneE164);
    if (owner && owner._id.toString() !== userId) {
      throw new BadRequestException('This phone number is already in use');
    }

    const approved = await this.smsProvider.checkCode(phoneE164, code);
    if (!approved) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // (b) Mark the user's phone verified (mirrors onto `mobile` too).
    await this.usersService.setPhoneVerified(userId, phoneE164);

    // (c) Upsert the anti-farm registry row for this phone. firstUserId is only
    // set on insert, so it always points at the ORIGINAL owner of the number.
    const registry = await this.phoneRegistryModel
      .findOneAndUpdate(
        { phoneE164 },
        { $setOnInsert: { phoneE164, firstUserId: new Types.ObjectId(userId) } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    // (d) One-time welcome credit — keyed by phone.
    const welcomeGranted = await this.maybeGrantWelcomeCredit(
      userId,
      phoneE164,
      registry,
    );

    return { verified: true, welcomeGranted };
  }

  /**
   * Grants the welcome (promo) credit exactly once per phone number.
   * Returns true only when THIS call performed the grant.
   */
  private async maybeGrantWelcomeCredit(
    userId: string,
    phoneE164: string,
    registry: PhoneRegistryDocument,
  ): Promise<boolean> {
    if (registry.welcomeGranted) return false;

    const settings = await this.platformSettingsService.getSettings();
    const amount = settings.welcomeCreditAmount ?? 0;
    if (amount <= 0) return false;

    // Idempotent at the wallet layer too: same key => no double-credit even on
    // a reinstall / new account reusing this phone.
    await this.walletService.credit({
      userId,
      amount,
      bucket: WalletBucket.Promo,
      type: WalletTxnType.SignupCredit,
      description: 'Welcome credit',
      idempotencyKey: `welcome:${phoneE164}`,
    });

    // Flip the flag atomically; only the winner of the race reports granted.
    const res = await this.phoneRegistryModel
      .updateOne(
        { phoneE164, welcomeGranted: false },
        { $set: { welcomeGranted: true } },
      )
      .exec();

    return res.modifiedCount === 1;
  }
}
