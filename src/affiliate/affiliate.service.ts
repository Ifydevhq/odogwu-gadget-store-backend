/**
 * affiliate/affiliate.service.ts
 * ===============================
 * Affiliate program business logic.
 *
 * LIFECYCLE
 *   1. resolveAttributions   — at checkout, resolve each item's affiliate code
 *      to a snapshot (affiliateUserId + percent + amount) written onto the
 *      order item. Never throws; invalid codes are simply dropped.
 *   2. processOrderCompletion — when an order COMPLETES, idempotently create a
 *      PENDING wallet credit (Earned bucket) held for `affiliateHoldDays` and a
 *      matching AffiliateCommission row.
 *   3. matureDueCommissions   — hourly cron; matures pending commissions whose
 *      hold has elapsed (pending wallet txn -> available).
 *   4. reverseForOrder        — on cancel/refund, reverse/cancel the order's
 *      commissions (pending -> cancelled, available -> reversed). Idempotent.
 *
 * @Global so OrdersService / OrdersCronService can inject AffiliateService
 * WITHOUT importing this module (mirrors ReferralsService) — this module reads
 * orders via its own injected Order model, never OrdersService, to avoid an
 * OrdersModule <-> AffiliateModule cycle.
 *
 * All money is in KOBO.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import {
  AffiliateCommission,
  AffiliateCommissionDocument,
  AffiliateCommissionStatus,
} from './schemas/affiliate-commission.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Listing, ListingDocument } from '../listings/schemas/listing.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { WalletService } from '../wallet/wallet.service';
import {
  WalletBucket,
  WalletTxnType,
  WalletTxnStatus,
} from '../wallet/schemas/wallet-transaction.schema';
import { PaginationDto } from '../common/dto/pagination.dto';

/** Snapshot written onto an order item when a code resolves. */
export interface AffiliateAttribution {
  affiliateCode: string;
  affiliateUserId: Types.ObjectId;
  affiliateCommissionPercent: number;
  affiliateCommissionAmount: number;
}

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(
    @InjectModel(AffiliateCommission.name)
    private readonly commissionModel: Model<AffiliateCommissionDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {}

  // ─── 1. Resolve attribution at checkout ──────────────────

  /**
   * For each item whose listingId appears in `affiliateCodes`, resolve the code
   * to a valid affiliate (isAffiliate, not the buyer) on an affiliate-enabled
   * listing, and compute the commission snapshot. Returns a Map keyed by the
   * item's listingId (string). Never throws — on any error returns what it has.
   */
  async resolveAttributions(
    buyerId: string | Types.ObjectId,
    items: Array<{ listingId: string | Types.ObjectId; totalPrice: number }>,
    affiliateCodes?: Record<string, string>,
  ): Promise<Map<string, AffiliateAttribution>> {
    const result = new Map<string, AffiliateAttribution>();
    if (!affiliateCodes || !items?.length) return result;

    try {
      const buyer = String(buyerId);

      // Distinct codes -> affiliate users (case-insensitive, must be affiliate).
      const codes = Array.from(
        new Set(
          Object.values(affiliateCodes)
            .filter(Boolean)
            .map((c) => String(c).trim().toUpperCase()),
        ),
      );
      if (!codes.length) return result;

      const affiliates = await this.userModel
        .find({ referralCode: { $in: codes }, isAffiliate: true })
        .select('_id referralCode')
        .lean()
        .exec();
      const affiliateByCode = new Map<string, any>(
        affiliates.map((u) => [String(u.referralCode).toUpperCase(), u]),
      );
      if (!affiliateByCode.size) return result;

      // Listings referenced by the code map.
      const listingIds = items
        .map((i) => String(i.listingId))
        .filter((id) => affiliateCodes[id]);
      if (!listingIds.length) return result;

      const listings = await this.listingModel
        .find({ _id: { $in: listingIds.map((id) => new Types.ObjectId(id)) } })
        .select(
          '_id affiliateEnabled affiliateCommissionType ' +
            'affiliateCommissionPercent affiliateCommissionAmount',
        )
        .lean()
        .exec();
      const listingById = new Map<string, any>(
        listings.map((l) => [String(l._id), l]),
      );

      const settings = await this.platformSettingsService.getSettings();
      const defaultPct = settings?.affiliateDefaultCommissionPercent ?? 0;

      for (const item of items) {
        const listingIdStr = String(item.listingId);
        const rawCode = affiliateCodes[listingIdStr];
        if (!rawCode) continue;

        const code = String(rawCode).trim().toUpperCase();
        const affiliate = affiliateByCode.get(code);
        if (!affiliate) continue; // not a real affiliate

        // Block self-affiliate (buyer == affiliate).
        if (String(affiliate._id) === buyer) continue;

        const listing = listingById.get(listingIdStr);
        if (!listing || !listing.affiliateEnabled) continue;

        // Flat reward: a fixed amount (kobo) per sale, capped at the item total
        // so an affiliate can never earn more than the item is worth.
        let pct = 0;
        let amount = 0;
        if (listing.affiliateCommissionType === 'flat') {
          amount = Math.round(listing.affiliateCommissionAmount || 0);
          if (amount > item.totalPrice) amount = item.totalPrice;
        } else {
          pct =
            listing.affiliateCommissionPercent > 0
              ? listing.affiliateCommissionPercent
              : defaultPct;
          if (!(pct > 0)) continue;
          amount = Math.round((item.totalPrice * pct) / 100);
        }
        if (!(amount > 0)) continue;

        result.set(listingIdStr, {
          affiliateCode: code,
          affiliateUserId: affiliate._id as Types.ObjectId,
          affiliateCommissionPercent: pct,
          affiliateCommissionAmount: amount,
        });
      }
    } catch (err: any) {
      this.logger.error(`resolveAttributions failed: ${err?.message}`);
    }

    return result;
  }

  // ─── 2. Process order completion ─────────────────────────

  /**
   * For each order item with an affiliate attribution, idempotently create a
   * PENDING wallet credit (Earned bucket, held for affiliateHoldDays) and a
   * matching AffiliateCommission row. Skips items already recorded for this
   * order+listing. Fully self-contained try/catch — never breaks completion.
   */
  async processOrderCompletion(
    order: OrderDocument | any,
  ): Promise<void> {
    try {
      if (!order?.items?.length) return;

      const settings = await this.platformSettingsService.getSettings();
      const holdDays = settings?.affiliateHoldDays ?? 7;
      const orderId = order._id?.toString?.() ?? String(order._id);
      const buyerId = order.buyerId?.toString?.() ?? String(order.buyerId);

      for (const item of order.items) {
        const affiliateUserId = (item as any).affiliateUserId;
        const amount = (item as any).affiliateCommissionAmount;
        if (!affiliateUserId || !(amount > 0)) continue;

        const listingId = (item as any).listingId?.toString?.();
        if (!listingId) continue;

        // Skip if already recorded for this order+listing.
        const existing = await this.commissionModel
          .findOne({
            orderId: new Types.ObjectId(orderId),
            listingId: new Types.ObjectId(listingId),
          })
          .exec();
        if (existing) continue;

        const availableAt = new Date(
          Date.now() + holdDays * 24 * 60 * 60 * 1000,
        );

        try {
          // Pending wallet credit — idempotent per order+listing.
          const txn = await this.walletService.credit({
            userId: affiliateUserId,
            amount,
            bucket: WalletBucket.Earned,
            type: WalletTxnType.AffiliateCommission,
            status: WalletTxnStatus.Pending,
            description: `Affiliate commission for order ${order.orderNumber}`,
            refId: orderId,
            idempotencyKey: `affcomm:${orderId}:${listingId}`,
            availableAt,
          });

          await this.commissionModel.create({
            affiliateUserId,
            buyerId: new Types.ObjectId(buyerId),
            orderId: new Types.ObjectId(orderId),
            listingId: new Types.ObjectId(listingId),
            itemName: (item as any).itemName ?? '',
            orderNumber: order.orderNumber ?? '',
            amount,
            commissionPercent: (item as any).affiliateCommissionPercent ?? 0,
            status: AffiliateCommissionStatus.Pending,
            walletTxnId: txn._id as Types.ObjectId,
            availableAt,
          });
        } catch (err: any) {
          // Unique index race on the commission row — safe to ignore.
          if (err?.code === 11000) continue;
          this.logger.error(
            `processOrderCompletion item failed (order=${orderId} listing=${listingId}): ${err?.message}`,
          );
        }
      }
    } catch (err: any) {
      this.logger.error(
        `processOrderCompletion failed (order=${order?._id}): ${err?.message}`,
      );
    }
  }

  // ─── 3. Reverse on cancel / refund ───────────────────────

  /**
   * Reverse the affiliate commissions for an order. Pending commissions are
   * cancelled (their pending wallet credit reversed); available (matured)
   * commissions are reversed. Idempotent — already-settled rows are skipped.
   */
  async reverseForOrder(
    orderId: string | Types.ObjectId,
    reason: string,
  ): Promise<void> {
    try {
      const oid = new Types.ObjectId(String(orderId));
      const commissions = await this.commissionModel
        .find({
          orderId: oid,
          status: {
            $in: [
              AffiliateCommissionStatus.Pending,
              AffiliateCommissionStatus.Available,
            ],
          },
        })
        .exec();

      for (const commission of commissions) {
        try {
          if (commission.walletTxnId) {
            // reverse() handles both pending and available (matured) credits.
            await this.walletService.reverse(commission.walletTxnId, reason);
          }
          commission.status =
            commission.status === AffiliateCommissionStatus.Pending
              ? AffiliateCommissionStatus.Cancelled
              : AffiliateCommissionStatus.Reversed;
          await commission.save();
        } catch (err: any) {
          this.logger.error(
            `reverseForOrder commission ${commission._id} failed: ${err?.message}`,
          );
        }
      }
    } catch (err: any) {
      this.logger.error(
        `reverseForOrder failed (order=${String(orderId)}): ${err?.message}`,
      );
    }
  }

  // ─── 4. Maturation cron ──────────────────────────────────

  /**
   * Mature pending commissions whose hold has elapsed: the paired pending
   * wallet credit becomes available and the commission row is marked available.
   * Runs hourly. Self-contained — never throws out.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async matureDueCommissions(): Promise<void> {
    try {
      const now = new Date();
      const due = await this.commissionModel
        .find({
          status: AffiliateCommissionStatus.Pending,
          availableAt: { $lte: now },
        })
        .exec();

      if (!due.length) return;

      let matured = 0;
      for (const commission of due) {
        try {
          if (commission.walletTxnId) {
            await this.walletService.matureTransaction(commission.walletTxnId);
          }
          commission.status = AffiliateCommissionStatus.Available;
          await commission.save();
          matured++;
        } catch (err: any) {
          this.logger.error(
            `matureDueCommissions commission ${commission._id} failed: ${err?.message}`,
          );
        }
      }

      if (matured > 0) {
        this.logger.log(`Matured ${matured} affiliate commission(s).`);
      }
    } catch (err: any) {
      this.logger.error(`matureDueCommissions failed: ${err?.message}`);
    }
  }

  // ─── Affiliate-facing APIs ───────────────────────────────

  /** Opt the user into the affiliate program. */
  async join(userId: string): Promise<{ isAffiliate: boolean }> {
    await this.userModel
      .updateOne(
        { _id: new Types.ObjectId(userId) },
        { $set: { isAffiliate: true } },
      )
      .exec();
    return { isAffiliate: true };
  }

  /** Headline balances for the affiliate dashboard. */
  async getSummary(userId: string): Promise<{
    isAffiliate: boolean;
    pendingAmount: number;
    availableAmount: number;
    totalEarned: number;
  }> {
    const uid = new Types.ObjectId(userId);

    const [user, agg] = await Promise.all([
      this.userModel.findById(uid).select('isAffiliate').lean().exec(),
      this.commissionModel.aggregate([
        { $match: { affiliateUserId: uid } },
        { $group: { _id: '$status', total: { $sum: '$amount' } } },
      ]),
    ]);

    let pendingAmount = 0;
    let availableAmount = 0;
    for (const row of agg) {
      if (row._id === AffiliateCommissionStatus.Pending)
        pendingAmount = row.total;
      else if (row._id === AffiliateCommissionStatus.Available)
        availableAmount = row.total;
    }

    return {
      isAffiliate: !!user?.isAffiliate,
      pendingAmount,
      availableAmount,
      totalEarned: pendingAmount + availableAmount,
    };
  }

  /** Paginated commission history for the affiliate. */
  async listCommissions(
    userId: string,
    paging: PaginationDto,
  ): Promise<{
    items: AffiliateCommissionDocument[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const page = paging.page ?? 1;
    const perPage = paging.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const affiliateUserId = new Types.ObjectId(userId);

    const [items, total] = await Promise.all([
      this.commissionModel
        .find({ affiliateUserId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.commissionModel.countDocuments({ affiliateUserId }).exec(),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  /** Build a per-product affiliate share link (only if affiliate-enabled). */
  async getLink(
    userId: string,
    listingId: string,
  ): Promise<{ listingId: string; affiliateCode: string; link: string }> {
    const [user, listing] = await Promise.all([
      this.userModel.findById(userId).select('referralCode').lean().exec(),
      this.listingModel
        .findById(listingId)
        .select('affiliateEnabled')
        .lean()
        .exec(),
    ]);

    if (!listing) {
      throw new Error('Listing not found');
    }
    if (!listing.affiliateEnabled) {
      throw new Error('This product does not have affiliate enabled');
    }

    const code = user?.referralCode ?? '';
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ||
      'http://localhost:3000';
    const base = frontendUrl.replace(/\/+$/, '');
    const link = `${base}/product/${listingId}?aff=${code}`;

    return { listingId, affiliateCode: code, link };
  }

  /** Paginated list of affiliate-enabled live listings (optionally searched). */
  async listAffiliateProducts(
    paging: PaginationDto,
    search?: string,
  ): Promise<{
    items: ListingDocument[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const page = paging.page ?? 1;
    const perPage = paging.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const filter: Record<string, any> = {
      affiliateEnabled: true,
      status: 'live',
    };

    // Free-text search over the product name (case-insensitive, escaped).
    const term = (search ?? '').trim();
    if (term) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.itemName = { $regex: escaped, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      this.listingModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .exec(),
      this.listingModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
