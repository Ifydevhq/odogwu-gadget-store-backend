/**
 * orders/orders-cron.service.ts - Order Auto-Complete Cron Job
 * ==============================================================
 * Automatically marks delivered orders as 'completed' after the
 * return window expires.
 *
 * HOW IT WORKS:
 *   1. Runs every 30 minutes
 *   2. Reads `maxReturnHoursBeforeAutoComplete` from platform settings (default 72h)
 *   3. Finds all orders with status 'delivered' where `trackingInfo.deliveredAt`
 *      is older than the configured threshold
 *   4. Bulk-updates them to 'completed' and transitions disbursement status
 *
 * WHY A SEPARATE SERVICE:
 *   Keeps cron logic out of the main OrdersService, which is already large.
 *   This service directly uses the Order model for efficient bulk updates
 *   instead of calling updateStatus() one-by-one (which sends emails per order).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { ReferralsService } from '../referrals/referrals.service';
import { AffiliateService } from '../affiliate/affiliate.service';
import { OrderStatus } from '@config/contants';

@Injectable()
export class OrdersCronService {
  private readonly logger = new Logger(OrdersCronService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private platformSettingsService: PlatformSettingsService,
    // @Global ReferralsModule — injected directly to avoid a module cycle.
    private referralsService: ReferralsService,
    // @Global AffiliateModule — injected directly to avoid a module cycle.
    private affiliateService: AffiliateService,
  ) {}

  /**
   * Auto-complete delivered orders after the return window expires.
   * Runs every 30 minutes.
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async autoCompleteDeliveredOrders(): Promise<void> {
    try {
      // Get the configurable threshold from platform settings
      const settings = await this.platformSettingsService.getSettings();
      const maxHours = settings?.maxReturnHoursBeforeAutoComplete ?? 72;

      // Calculate the cutoff date: orders delivered before this time should auto-complete
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - maxHours);

      // Capture the buyers of the orders about to auto-complete BEFORE the bulk
      // update, so we can run the referral cumulative-spend check for each of
      // them afterwards (they will then be counted in the Completed aggregate).
      // Fetch full docs (not just buyerId) so affiliate processing can read
      // each order's items[] after the bulk completion below.
      const qualifying = await this.orderModel
        .find({
          status: OrderStatus.Delivered,
          'trackingInfo.deliveredAt': { $lte: cutoffDate },
        })
        .exec();

      // Find and update all qualifying orders in one bulk operation
      const result = await this.orderModel.updateMany(
        {
          status: OrderStatus.Delivered,
          'trackingInfo.deliveredAt': { $lte: cutoffDate },
        },
        {
          $set: {
            status: OrderStatus.Completed,
            adminNote: `Auto-completed after ${maxHours}h return window expired`,
          },
        },
      );

      // Also transition disbursement status for the affected orders
      // (awaiting_completion → awaiting_disbursement)
      if (result.modifiedCount > 0) {
        await this.orderModel.updateMany(
          {
            status: OrderStatus.Completed,
            adminNote: { $regex: /^Auto-completed after/ },
            disbursementStatus: 'awaiting_completion',
          },
          {
            $set: { disbursementStatus: 'awaiting_disbursement' },
          },
        );

        this.logger.log(
          `Auto-completed ${result.modifiedCount} delivered order(s) ` +
            `(return window: ${maxHours}h, cutoff: ${cutoffDate.toISOString()})`,
        );

        // Referral: recompute cumulative spend once per distinct buyer. Each
        // call is self-contained (never throws) so it cannot break the cron.
        const distinctBuyers = new Set(
          qualifying.map((o) => o.buyerId?.toString()).filter(Boolean),
        );
        for (const buyerId of distinctBuyers) {
          await this.referralsService.recordCompletedOrder(buyerId);
        }

        // Affiliate: create held commissions for each auto-completed order.
        // Each call is self-contained (never throws) so it cannot break the
        // cron; processOrderCompletion is idempotent per order+listing.
        for (const order of qualifying) {
          await this.affiliateService.processOrderCompletion(order);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to auto-complete delivered orders: ${error.message}`,
        error.stack,
      );
    }
  }
}
