/**
 * withdrawals/withdrawals.module.ts
 * ==================================
 * REQUEST-ONLY withdrawals. Reuses the @Global WalletService (hold debit +
 * rejection reversal) and PlatformSettingsService (minWithdrawalAmount).
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { WithdrawalsService } from './withdrawals.service';
import {
  WithdrawalsController,
  AdminWithdrawalsController,
} from './withdrawals.controller';
import {
  WithdrawalRequest,
  WithdrawalRequestSchema,
} from './schemas/withdrawal-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WithdrawalRequest.name, schema: WithdrawalRequestSchema },
    ]),
    PlatformSettingsModule,
  ],
  controllers: [WithdrawalsController, AdminWithdrawalsController],
  providers: [WithdrawalsService],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
