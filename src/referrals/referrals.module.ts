/**
 * referrals/referrals.module.ts
 * ==============================
 * Wires up the referral rewards system.
 *
 * @Global so ReferralsService is injectable WITHOUT other modules importing
 * this one — that is how OrdersService, AuthService and PhoneService call into
 * it without creating a circular module dependency. This module reads orders
 * via its own injected Order model (not OrdersService) precisely to avoid an
 * OrdersModule ↔ ReferralsModule cycle.
 *
 * It registers the Referral, PhoneRegistry and Order schemas it needs, and
 * imports UsersModule + PlatformSettingsModule (neither of which depends on
 * referrals). WalletService comes from the @Global WalletModule.
 */

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Referral, ReferralSchema } from './schemas/referral.schema';
import {
  PhoneRegistry,
  PhoneRegistrySchema,
} from '../phone-verification/schemas/phone-registry.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { UsersModule } from '../users/users.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Referral.name, schema: ReferralSchema },
      { name: PhoneRegistry.name, schema: PhoneRegistrySchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    UsersModule,
    PlatformSettingsModule,
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
