/**
 * referrals/referrals.service.ts
 * ===============================
 * Referral rewards business logic.
 *
 * LIFECYCLE
 *   1. registerReferral        — at signup, once the referrer's code resolves.
 *   2. activateOnPhoneVerified — when the referee verifies their phone. Claims
 *      the phone in PhoneRegistry (one referral redemption per phone) or voids
 *      the referral if that phone already redeemed one (anti-farm).
 *   3. recordCompletedOrder    — each time one of the referee's orders reaches
 *      Completed. Recomputes the referee's TOTAL completed-order spend; once it
 *      crosses `referralMinOrderAmount`, pays the referrer the one-time reward.
 *
 * All money is in KOBO. Rewards are idempotent at the wallet layer
 * (idempotencyKey `referral:<refereeId>`) AND guarded by the referral status.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Referral, ReferralDocument, ReferralStatus } from './schemas/referral.schema';
import {
  PhoneRegistry,
  PhoneRegistryDocument,
} from '../phone-verification/schemas/phone-registry.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { UsersService } from '../users/users.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { WalletService } from '../wallet/wallet.service';
import {
  WalletBucket,
  WalletTxnType,
} from '../wallet/schemas/wallet-transaction.schema';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OrderStatus } from '@config/contants';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    @InjectModel(Referral.name)
    private readonly referralModel: Model<ReferralDocument>,
    @InjectModel(PhoneRegistry.name)
    private readonly phoneRegistryModel: Model<PhoneRegistryDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    private readonly usersService: UsersService,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {}

  // ─── 1. Register at signup ───────────────────────────────

  /**
   * Create the Referral row (status 'pending') for a newly-signed-up referee.
   * No-ops if it is a self-referral or a row already exists. Never throws.
   */
  async registerReferral(
    referrerId: string | Types.ObjectId,
    refereeId: string | Types.ObjectId,
  ): Promise<ReferralDocument | null> {
    const referrer = String(referrerId);
    const referee = String(refereeId);

    if (!referrer || !referee || referrer === referee) {
      return null; // no self-refer
    }

    try {
      const existing = await this.referralModel
        .findOne({ refereeId: new Types.ObjectId(referee) })
        .exec();
      if (existing) return existing;

      return await this.referralModel.create({
        referrerId: new Types.ObjectId(referrer),
        refereeId: new Types.ObjectId(referee),
        status: ReferralStatus.Pending,
        cumulativeQualifyingSpend: 0,
      });
    } catch (err: any) {
      // Unique index race (two concurrent signups) — return the existing row.
      if (err?.code === 11000) {
        return this.referralModel
          .findOne({ refereeId: new Types.ObjectId(referee) })
          .exec();
      }
      this.logger.error(
        `registerReferral failed (referrer=${referrer} referee=${referee}): ${err?.message}`,
      );
      return null;
    }
  }

  // ─── 2. Activate on phone verification ───────────────────

  /**
   * Called when the referee verifies their phone. Enforces the anti-farm rule
   * of ONE referral redemption per phone number:
   *   - If this phone already redeemed a referral (on any prior account), void
   *     THIS referral.
   *   - Otherwise atomically claim the phone (referralRedeemed = true) and mark
   *     the referral eligible (records the referee's phone; stays 'pending'
   *     until the spend threshold is met). Never throws.
   */
  async activateOnPhoneVerified(
    refereeId: string | Types.ObjectId,
    phoneE164: string,
  ): Promise<void> {
    try {
      const referee = new Types.ObjectId(String(refereeId));

      const referral = await this.referralModel.findOne({ refereeId: referee }).exec();
      if (!referral) return; // this user was not referred — nothing to do
      if (
        referral.status === ReferralStatus.Rewarded ||
        referral.status === ReferralStatus.Void
      ) {
        return; // already settled one way or the other
      }

      // Has this phone already redeemed a referral (previous account)?
      const registry = await this.phoneRegistryModel
        .findOne({ phoneE164 })
        .exec();

      if (registry?.referralRedeemed) {
        // Anti-farm: this phone already paid out a referral elsewhere.
        referral.status = ReferralStatus.Void;
        referral.refereePhoneE164 = phoneE164;
        await referral.save();
        this.logger.warn(
          `Referral for referee ${referee.toString()} voided: phone ${phoneE164} already redeemed a referral.`,
        );
        return;
      }

      // Atomically claim the phone for this referral (only the first wins).
      const claim = await this.phoneRegistryModel
        .updateOne(
          { phoneE164, referralRedeemed: { $ne: true } },
          { $set: { referralRedeemed: true } },
        )
        .exec();

      if (claim.matchedCount === 0) {
        // The registry row does not exist yet (should have been upserted by the
        // phone-verify flow) or was claimed in a race — treat as already used.
        referral.status = ReferralStatus.Void;
        referral.refereePhoneE164 = phoneE164;
        await referral.save();
        return;
      }

      referral.refereePhoneE164 = phoneE164;
      await referral.save();
    } catch (err: any) {
      this.logger.error(
        `activateOnPhoneVerified failed (referee=${String(refereeId)} phone=${phoneE164}): ${err?.message}`,
      );
    }
  }

  // ─── 3. Record a completed order ─────────────────────────

  /**
   * Called when one of the referee's orders reaches Completed. Recomputes the
   * referee's cumulative completed-order spend and, once it crosses the
   * threshold, pays the referrer the one-time reward. Idempotent + never throws.
   */
  async recordCompletedOrder(
    refereeId: string | Types.ObjectId,
    _orderAmount?: number,
  ): Promise<void> {
    try {
      const referee = new Types.ObjectId(String(refereeId));

      const referral = await this.referralModel.findOne({ refereeId: referee }).exec();
      if (!referral) return; // not a referred user
      if (
        referral.status === ReferralStatus.Void ||
        referral.status === ReferralStatus.Rewarded
      ) {
        return; // voided or already paid — never double-reward
      }

      // Reward eligibility is gated on phone verification (anti-farm).
      const eligible = await this.usersService.isRewardEligible(referee.toString());
      if (!eligible) return;

      // Recompute the referee's TOTAL completed-order spend.
      const agg = await this.orderModel.aggregate([
        {
          $match: {
            buyerId: referee,
            status: OrderStatus.Completed,
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]);
      const totalSpend = agg[0]?.total ?? 0;

      referral.cumulativeQualifyingSpend = totalSpend;

      const settings = await this.platformSettingsService.getSettings();
      const minSpend = settings?.referralMinOrderAmount ?? 1000000;
      const rewardAmount = settings?.referralRewardAmount ?? 100000;

      if (totalSpend < minSpend) {
        // Threshold not yet reached — persist the running total and stop.
        await referral.save();
        return;
      }

      // Threshold reached.
      if (!referral.qualifiedAt) {
        referral.qualifiedAt = new Date();
        referral.status = ReferralStatus.Qualified;
      }

      if (rewardAmount > 0) {
        // Pay the REFERRER. Idempotent: the same key can never double-credit.
        const txn = await this.walletService.credit({
          userId: referral.referrerId,
          amount: rewardAmount,
          bucket: WalletBucket.Earned,
          type: WalletTxnType.ReferralReward,
          description: 'Referral reward',
          refId: referee.toString(),
          idempotencyKey: `referral:${referee.toString()}`,
        });
        referral.rewardTxnId = txn._id as Types.ObjectId;
      }

      referral.status = ReferralStatus.Rewarded;
      referral.rewardedAt = new Date();
      await referral.save();
    } catch (err: any) {
      this.logger.error(
        `recordCompletedOrder failed (referee=${String(refereeId)}): ${err?.message}`,
      );
    }
  }

  // ─── Read APIs ───────────────────────────────────────────

  private buildReferralLink(referralCode?: string): string {
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      'http://localhost:3000';
    const base = frontendUrl.replace(/\/+$/, '');
    return referralCode ? `${base}/?ref=${referralCode}` : base;
  }

  /**
   * Summary for the referral dashboard: the user's code + link and headline
   * stats (how many they referred, how many qualified, total rewarded value).
   */
  async getMyReferralSummary(userId: string): Promise<{
    referralCode: string;
    referralLink: string;
    totalReferred: number;
    totalQualified: number;
    totalRewardedAmount: number;
  }> {
    // findById lazily backfills a referral code for legacy accounts.
    const user = await this.usersService.findById(userId);
    const referralCode = user.referralCode ?? '';
    const referrerId = new Types.ObjectId(userId);

    const [totalReferred, totalQualified, rewardedAgg] = await Promise.all([
      this.referralModel.countDocuments({ referrerId }).exec(),
      this.referralModel
        .countDocuments({
          referrerId,
          status: { $in: [ReferralStatus.Qualified, ReferralStatus.Rewarded] },
        })
        .exec(),
      this.referralModel.countDocuments({
        referrerId,
        status: ReferralStatus.Rewarded,
      }).exec(),
    ]);

    const settings = await this.platformSettingsService.getSettings();
    const rewardAmount = settings?.referralRewardAmount ?? 100000;

    return {
      referralCode,
      referralLink: this.buildReferralLink(referralCode),
      totalReferred,
      totalQualified,
      totalRewardedAmount: rewardedAgg * rewardAmount,
    };
  }

  /**
   * Paginated history of the user's referees, with a masked identity for
   * privacy (first name + masked last name).
   */
  async listMyReferrals(
    userId: string,
    paging: PaginationDto,
  ): Promise<{
    items: Array<{
      id: string;
      name: string;
      status: ReferralStatus;
      cumulativeQualifyingSpend: number;
      qualifiedAt?: Date;
      rewardedAt?: Date;
      createdAt: Date;
    }>;
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const page = paging.page ?? 1;
    const perPage = paging.perPage ?? 20;
    const referrerId = new Types.ObjectId(userId);
    const skip = (page - 1) * perPage;

    const [rows, total] = await Promise.all([
      this.referralModel
        .find({ referrerId })
        .populate('refereeId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.referralModel.countDocuments({ referrerId }).exec(),
    ]);

    const items = rows.map((r) => {
      const referee = r.refereeId as any;
      return {
        id: r._id.toString(),
        name: this.maskName(referee?.firstName, referee?.lastName),
        status: r.status,
        cumulativeQualifyingSpend: r.cumulativeQualifyingSpend,
        qualifiedAt: r.qualifiedAt,
        rewardedAt: r.rewardedAt,
        createdAt: r.createdAt,
      };
    });

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  /** "John" + "Doe" → "John D." ; missing parts degrade gracefully. */
  private maskName(firstName?: string, lastName?: string): string {
    const first = (firstName || '').trim();
    const last = (lastName || '').trim();
    const initial = last ? `${last.charAt(0).toUpperCase()}.` : '';
    return [first || 'Anonymous', initial].filter(Boolean).join(' ');
  }
}
