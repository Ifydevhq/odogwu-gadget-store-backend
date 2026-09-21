/**
 * affiliate/affiliate.module.ts
 * ==============================
 * Wires up the affiliate program.
 *
 * @Global so AffiliateService is injectable WITHOUT other modules importing
 * this one — that is how OrdersService and OrdersCronService call into it
 * without creating a circular module dependency. This module reads orders via
 * its own injected Order model (not OrdersService), precisely to avoid an
 * OrdersModule <-> AffiliateModule cycle (same pattern as ReferralsModule).
 *
 * It registers the AffiliateCommission, Order, Listing and User schemas it
 * needs and imports PlatformSettingsModule. WalletService comes from the
 * @Global WalletModule.
 */

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AffiliateCommission,
  AffiliateCommissionSchema,
} from './schemas/affiliate-commission.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Listing, ListingSchema } from '../listings/schemas/listing.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { AffiliateService } from './affiliate.service';
import { AffiliateController } from './affiliate.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AffiliateCommission.name, schema: AffiliateCommissionSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Listing.name, schema: ListingSchema },
      { name: User.name, schema: UserSchema },
    ]),
    PlatformSettingsModule,
  ],
  controllers: [AffiliateController],
  providers: [AffiliateService],
  exports: [AffiliateService],
})
export class AffiliateModule {}
